/**
 * Test script for Vaccine Type CRUD operations
 * Run: node test-vaccine-crud.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
let authToken = '';
let createdVaccineId = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function loginAsManager() {
  try {
    log('\n📝 Step 1: Logging in as Manager...', colors.blue);
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'manager@petcare.com',
      password: 'Manager@123',
    });

    authToken = response.data.token;
    log('✅ Login successful!', colors.green);
    log(`Token: ${authToken.substring(0, 20)}...`, colors.yellow);
    return true;
  } catch (error) {
    log(`❌ Login failed: ${error.response?.data?.message || error.message}`, colors.red);
    return false;
  }
}

async function getAllVaccineTypes(step) {
  try {
    log(`\n📝 Step ${step}: Getting all vaccine types...`, colors.blue);
    const response = await axios.get(`${BASE_URL}/vaccine-types`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    log(`✅ Found ${response.data.length} vaccine types`, colors.green);
    response.data.slice(0, 3).forEach((v) => {
      log(`  - ${v.vaccineName} (${v.category}) - Active: ${v.isActive}`, colors.yellow);
    });
    return response.data;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, colors.red);
    return null;
  }
}

async function createVaccineType() {
  try {
    log('\n📝 Step 3: Creating new vaccine type...', colors.blue);
    const newVaccine = {
      category: 'Core',
      vaccineName: 'Test Vaccine - Automated Test',
      targetSpecies: 'Dog',
      manufacturer: 'Test Manufacturer',
      description: 'This is a test vaccine created by automated script',
      recommendedAgeMonths: 3,
      boosterIntervalMonths: 12,
    };

    const response = await axios.post(`${BASE_URL}/vaccine-types`, newVaccine, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    createdVaccineId = response.data.data.vaccineTypeId;
    log(`✅ Vaccine created with ID: ${createdVaccineId}`, colors.green);
    log(`   Name: ${response.data.data.vaccineName}`, colors.yellow);
    return response.data.data;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, colors.red);
    return null;
  }
}

async function testDuplicateCreate() {
  try {
    log('\n📝 Step 4: Testing duplicate name validation...', colors.blue);
    const duplicateVaccine = {
      category: 'Core',
      vaccineName: 'Test Vaccine - Automated Test',
      targetSpecies: 'Cat',
    };

    await axios.post(`${BASE_URL}/vaccine-types`, duplicateVaccine, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    log('❌ Duplicate validation FAILED - should have rejected', colors.red);
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      log('✅ Duplicate validation working correctly', colors.green);
      return true;
    }
    log(`❌ Unexpected error: ${error.message}`, colors.red);
    return false;
  }
}

async function updateVaccineType() {
  try {
    log('\n📝 Step 5: Updating vaccine type...', colors.blue);
    const updates = {
      vaccineName: 'Test Vaccine - UPDATED',
      manufacturer: 'Updated Manufacturer',
      boosterIntervalMonths: 24,
    };

    const response = await axios.put(
      `${BASE_URL}/vaccine-types/${createdVaccineId}`,
      updates,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    log(`✅ Vaccine updated successfully`, colors.green);
    log(`   New name: ${response.data.data.vaccineName}`, colors.yellow);
    log(`   New booster interval: ${response.data.data.boosterIntervalMonths} months`, colors.yellow);
    return response.data.data;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, colors.red);
    return null;
  }
}

async function deleteVaccineType() {
  try {
    log('\n📝 Step 6: Soft deleting vaccine type...', colors.blue);
    const response = await axios.delete(`${BASE_URL}/vaccine-types/${createdVaccineId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    log(`✅ Vaccine soft deleted: ${response.data.message}`, colors.green);
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, colors.red);
    return false;
  }
}

async function verifyDeletion() {
  try {
    log('\n📝 Step 7: Verifying soft deletion (should not appear in active list)...', colors.blue);
    const vaccines = await getAllVaccineTypes('7');
    
    const deletedVaccine = vaccines?.find((v) => v.vaccineTypeId === createdVaccineId);
    
    if (!deletedVaccine) {
      log('✅ Soft deletion verified - vaccine not in active list', colors.green);
      return true;
    } else {
      log('❌ Soft deletion FAILED - vaccine still appears', colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Failed: ${error.message}`, colors.red);
    return false;
  }
}

async function runAllTests() {
  log('='.repeat(60), colors.blue);
  log('🚀 Starting Vaccine Type CRUD Tests', colors.blue);
  log('='.repeat(60), colors.blue);

  const loginSuccess = await loginAsManager();
  if (!loginSuccess) {
    log('\n❌ Cannot proceed without authentication', colors.red);
    return;
  }

  await getAllVaccineTypes(2);
  await createVaccineType();
  await testDuplicateCreate();
  await updateVaccineType();
  await getAllVaccineTypes('5.5');
  await deleteVaccineType();
  await verifyDeletion();

  log('\n' + '='.repeat(60), colors.blue);
  log('✅ All tests completed!', colors.green);
  log('='.repeat(60), colors.blue);
}

runAllTests().catch((error) => {
  log(`\n❌ Test suite failed: ${error.message}`, colors.red);
  process.exit(1);
});
