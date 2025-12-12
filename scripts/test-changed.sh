#!/bin/bash
# Selective Test Runner for Pet_BE
# Detects changed files and runs only affected tests
# Uses file pattern matching (reliable) with Jest's --findRelatedTests as enhancement

set -e

BASE_BRANCH=${BASE_BRANCH:-main}
JEST_CONFIG="./tests/unit/jest.json"

echo "🔍 Selective Test Runner"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Base branch: $BASE_BRANCH"
echo ""

# Get changed files by comparing with base branch or previous commit
if git rev-parse --verify "origin/$BASE_BRANCH" > /dev/null 2>&1; then
  CHANGED_FILES=$(git diff --name-only "origin/$BASE_BRANCH"...HEAD 2>/dev/null || git diff --name-only HEAD~1 2>/dev/null || echo "")
else
  CHANGED_FILES=$(git diff --name-only HEAD~1 2>/dev/null || echo "")
fi

# If no changes detected, skip tests (fast path)
if [ -z "$CHANGED_FILES" ]; then
  echo "✅ No changed files detected. Skipping tests."
  exit 0
fi

echo "📋 Changed files:"
echo "$CHANGED_FILES" | sed 's/^/  - /'
echo ""

# Check for critical config changes that require full test suite
CRITICAL_PATTERNS="package.json|package-lock.json|tsconfig.json|jest.json|\.github/workflows"
if echo "$CHANGED_FILES" | grep -qE "$CRITICAL_PATTERNS"; then
  echo "⚠️  Critical configuration files changed. Running FULL test suite..."
  npx jest --config "$JEST_CONFIG" --passWithNoTests
  exit $?
fi

# Collect test files to run
TESTS_TO_RUN=()

# Process each changed file
while IFS= read -r file; do
  case "$file" in
    # Directly changed test files → run them
    tests/unit/*.spec.ts|tests/unit/**/*.spec.ts)
      TESTS_TO_RUN+=("$file")
      echo "🧪 Test file changed: $file"
      ;;
    
    # Service files → run corresponding service test
    src/services/*.ts)
      SERVICE_NAME=$(basename "$file" .ts | sed 's/\.service$//')
      TEST_FILE="tests/unit/services/${SERVICE_NAME}.service.spec.ts"
      if [ -f "$TEST_FILE" ]; then
        TESTS_TO_RUN+=("$TEST_FILE")
        echo "📦 Service changed: $file → $TEST_FILE"
      fi
      ;;
    
    # Controller files → run corresponding controller test
    src/controllers/*.ts)
      CONTROLLER_NAME=$(basename "$file" .ts | sed 's/\.controller$//')
      TEST_FILE="tests/unit/controllers/${CONTROLLER_NAME}.controller.spec.ts"
      if [ -f "$TEST_FILE" ]; then
        TESTS_TO_RUN+=("$TEST_FILE")
        echo "📦 Controller changed: $file → $TEST_FILE"
      fi
      ;;
    
    # Entity files → run related service AND controller tests
    src/entities/*.ts)
      ENTITY_NAME=$(basename "$file" .ts | sed 's/\.entity$//')
      echo "📦 Entity changed: $file"
      # Run corresponding service test if exists
      SERVICE_TEST="tests/unit/services/${ENTITY_NAME}.service.spec.ts"
      if [ -f "$SERVICE_TEST" ]; then
        TESTS_TO_RUN+=("$SERVICE_TEST")
        echo "   → $SERVICE_TEST"
      fi
      # Run corresponding controller test if exists
      CONTROLLER_TEST="tests/unit/controllers/${ENTITY_NAME}.controller.spec.ts"
      if [ -f "$CONTROLLER_TEST" ]; then
        TESTS_TO_RUN+=("$CONTROLLER_TEST")
        echo "   → $CONTROLLER_TEST"
      fi
      ;;
    
    # DTO files → run related service AND controller tests
    src/dto/*.ts)
      DTO_NAME=$(basename "$file" .ts | sed 's/\.dto$//' | sed 's/-dto$//')
      echo "📦 DTO changed: $file"
      # Find tests that might be related
      for test_file in tests/unit/services/*.spec.ts tests/unit/controllers/*.spec.ts; do
        if [ -f "$test_file" ]; then
          if echo "$test_file" | grep -qi "$DTO_NAME"; then
            TESTS_TO_RUN+=("$test_file")
            echo "   → $test_file"
          fi
        fi
      done
      ;;
    
    # Module files → run all tests for that module
    src/modules/*.ts)
      MODULE_NAME=$(basename "$file" .ts | sed 's/\.module$//')
      echo "📦 Module changed: $file"
      SERVICE_TEST="tests/unit/services/${MODULE_NAME}.service.spec.ts"
      CONTROLLER_TEST="tests/unit/controllers/${MODULE_NAME}.controller.spec.ts"
      [ -f "$SERVICE_TEST" ] && TESTS_TO_RUN+=("$SERVICE_TEST") && echo "   → $SERVICE_TEST"
      [ -f "$CONTROLLER_TEST" ] && TESTS_TO_RUN+=("$CONTROLLER_TEST") && echo "   → $CONTROLLER_TEST"
      ;;
    
    # Documentation/config only → skip
    *.md|docs/*|README*|.gitignore|.prettierrc)
      echo "📄 Non-code file changed: $file (skipped)"
      ;;
    
    # Unknown files → log but don't run tests
    *)
      echo "❓ Unclassified change: $file"
      ;;
  esac
done <<< "$CHANGED_FILES"

# Remove duplicates from array
UNIQUE_TESTS=($(echo "${TESTS_TO_RUN[@]}" | tr ' ' '\n' | sort -u))

if [ ${#UNIQUE_TESTS[@]} -eq 0 ]; then
  echo ""
  echo "✅ No test files affected by changes. Skipping tests."
  exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Running ${#UNIQUE_TESTS[@]} affected test file(s)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Run the selected tests
npx jest --config "$JEST_CONFIG" "${UNIQUE_TESTS[@]}" --passWithNoTests
RESULT=$?

echo ""
if [ $RESULT -eq 0 ]; then
  echo "✅ All affected tests passed!"
else
  echo "❌ Some tests failed."
fi

exit $RESULT
