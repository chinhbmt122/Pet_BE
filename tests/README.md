# Pet_BE Testing Strategy

## Overview

This document describes the testing strategy for the Pet_BE backend, following the **Test Pyramid** methodology and industry best practices.

## Test Pyramid Structure

```
                 ┌───────────┐
                 │   E2E     │  ← Few: Critical user flows
                 │  (5-10%)  │     
                 └─────┬─────┘
                       │
              ┌────────┴────────┐
              │  Integration    │  ← Some: API + DB tests
              │   (20-30%)      │     
              └────────┬────────┘
                       │
         ┌─────────────┴─────────────┐
         │       Unit Tests          │  ← Many: Fast, isolated
         │       (60-70%)            │     
         └───────────────────────────┘
```

## Directory Structure

```
tests/
├── helpers/                    # Shared test utilities
│   ├── mock-helpers.ts        # Repository, service, and entity mocks
│   ├── assertion-helpers.ts   # Standardized error assertions
│   └── index.ts               # Re-exports all helpers
├── unit/                       # Unit tests (fast, isolated)
│   ├── entities/              # Entity domain logic tests
│   │   ├── invoice.entity.spec.ts
│   │   ├── invoice.property.spec.ts   # Property-based tests
│   │   ├── payment.entity.spec.ts
│   │   └── payment.property.spec.ts
│   ├── services/              # Service layer tests
│   │   ├── payment.service.spec.ts
│   │   └── appointment.service.spec.ts
│   └── controllers/           # Controller unit tests
├── integration/               # Integration tests (API + real DB)
│   ├── test-helper.ts         # Test app & cleanup utilities
│   └── controllers/           # Controller integration tests
├── e2e/                       # End-to-end tests (full flows)
│   ├── flows/                 # Critical business flows
│   │   └── appointment-complete-pay.e2e-spec.ts
│   └── comprehensive.e2e-spec.ts
└── README.md                  # This file
```

## Test Categories

### Unit Tests (`tests/unit/`)

**Purpose:** Test individual classes/functions in isolation.

**Characteristics:**
- Use mocks for all dependencies
- Fast execution (< 1 second per test)
- No database or network calls
- Test business logic, not frameworks

**Example:**
```typescript
describe('Invoice Entity', () => {
  it('should transition from PENDING to PAID on payByCash()', () => {
    const invoice = new Invoice();
    invoice.status = InvoiceStatus.PENDING;
    
    invoice.payByCash();
    
    expect(invoice.status).toBe(InvoiceStatus.PAID);
    expect(invoice.paidAt).toBeInstanceOf(Date);
  });
});
```

### Integration Tests (`tests/integration/`)

**Purpose:** Test API endpoints with real database.

**Characteristics:**
- Use real PostgreSQL (Docker)
- Test controller → service → repository flow
- Test authentication/authorization
- Clean database between tests

**Running:**
```bash
# Start test database
docker-compose -f docker-compose.e2e.yml up -d

# Run integration tests
npm run test:integration
```

### E2E Tests (`tests/e2e/`)

**Purpose:** Test complete user journeys.

**Characteristics:**
- Test critical business flows end-to-end
- Verify state transitions across services
- Simulate real user scenarios
- Fewer tests, higher confidence

**Example Flow:**
```
Create Appointment → Confirm → Start → Complete → Create Invoice → Pay
```

## Test Utilities

### Mock Helpers (`tests/helpers/mock-helpers.ts`)

Provides factory functions for creating mocks:

```typescript
import { createMockRepository, createMockDataSource } from '../helpers';

const repository = createMockRepository<Invoice>();
repository.findOne.mockResolvedValue(mockInvoice);

const dataSource = createMockDataSource({
  managerMocks: { save: jest.fn().mockResolvedValue(mockEntity) }
});
```

### Assertion Helpers (`tests/helpers/assertion-helpers.ts`)

Standardized error assertions:

```typescript
import { expectHttpError, expectNotFoundError } from '../helpers';

// Check specific HTTP error
await expectHttpError(
  () => service.processPayment(dto),
  { status: HttpStatus.NOT_FOUND, i18nKey: 'errors.notFound.invoice' }
);

// Shorthand for common errors
await expectNotFoundError(() => service.getInvoice(999), 'invoice');
```

### Transaction Test Context

For faster test cleanup using transaction rollback:

```typescript
import { createTransactionTestContext } from '../integration/test-helper';

let ctx: TransactionTestContext;

beforeEach(async () => {
  ctx = await createTransactionTestContext(app);
});

afterEach(async () => {
  await ctx.rollback(); // 10-50x faster than TRUNCATE
});

it('test', async () => {
  await ctx.manager.save(Account, { ... });
});
```

## Property-Based Testing

We use [fast-check](https://github.com/dubzzz/fast-check) for discovering edge cases:

```typescript
import * as fc from 'fast-check';

it('PROPERTY: Refund amount must be <= payment amount', () => {
  fc.assert(
    fc.property(fc.integer({ min: 1, max: 100000 }), (amount) => {
      const payment = createPayment({ amount, status: 'SUCCESS' });
      expect(() => payment.refund(amount + 1, 'reason')).toThrow();
    })
  );
});
```

## Running Tests

```bash
# All unit tests
npm run test:unit

# Specific service tests
npm run test:services

# Integration tests (requires Docker)
npm run test:integration

# E2E tests (requires Docker)
npm run test:e2e

# With coverage
npm run test:cov
```

## Best Practices

### 1. Use Descriptive Test Names
```typescript
// ✅ Good
it('should throw 404 when invoice does not exist', ...)

// ❌ Bad
it('test 1', ...)
```

### 2. Follow AAA Pattern
```typescript
it('should process cash payment', () => {
  // Arrange
  const payment = createPayment({ method: 'CASH' });
  
  // Act
  payment.processCash();
  
  // Assert
  expect(payment.status).toBe('SUCCESS');
});
```

### 3. Test Behavior, Not Implementation
```typescript
// ✅ Good: Test the OUTPUT
expect(result.status).toBe('PAID');

// ❌ Bad: Test the internal call
expect(repository.save).toHaveBeenCalledWith({ ... });
```

### 4. Use Standardized Error Assertions
```typescript
// ✅ Consistent
await expectHttpError(fn, { status: 404, i18nKey: 'errors.notFound.invoice' });

// ❌ Inconsistent
await expect(fn).rejects.toThrow();
```

### 5. Entity Logic Tests Don't Need Mocks
```typescript
// Entity domain logic: no mocks needed
describe('Invoice.payByCash()', () => {
  it('should set paidAt timestamp', () => {
    const invoice = new Invoice();
    invoice.status = InvoiceStatus.PENDING;
    
    invoice.payByCash();
    
    expect(invoice.paidAt).toBeInstanceOf(Date);
  });
});
```

## CI/CD Integration

Tests are run in the following order:
1. **Unit tests** (fastest, run first)
2. **Integration tests** (require database)
3. **E2E tests** (full flows, run last)

If any stage fails, subsequent stages are skipped.
