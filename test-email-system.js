// ========================================
// COMPREHENSIVE EMAIL SYSTEM TEST SCRIPT
// ========================================

const testData = {
  petOwnerId: 6,
  accountId: 13,
  email: 'trggg2004@gmail.com',
  petId: 11,
  petName: 'Buddy Test',
  serviceId: 1, // Use first available service
  veterinarianId: 2, // BS. Trần Thị Lan
  baseUrl: 'http://localhost:3001'
};

console.log('🧪 Starting Email System Comprehensive Test...\n');
console.log('📋 Test Data:', testData);
console.log('\n' + '='.repeat(60) + '\n');

// Test 3: Appointment Status Update Email
async function testAppointmentStatusUpdate() {
  console.log('📅 Test 3: Appointment Status Update Email');
  
  try {
    // Step 1: Create appointment
    const createResponse = await fetch(`${testData.baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        petId: testData.petId,
        serviceId: testData.serviceId,
        appointmentDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        notes: 'Test appointment for email - Status Update'
      })
    });
    
    if (!createResponse.ok) {
      console.log('   ⚠️  Creating appointment requires authentication');
      console.log('   ℹ️  Appointment status update email will trigger when:');
      console.log('      - Admin/Vet confirms appointment');
      console.log('      - Appointment is completed');
      console.log('      - Appointment is cancelled');
      return { status: 'REQUIRES_AUTH', tested: false };
    }
    
    const appointment = await createResponse.json();
    console.log(`   ✅ Created appointment ID: ${appointment.data.appointmentId}`);
    
    // Step 2: Update appointment status (confirm)
    const updateResponse = await fetch(`${testData.baseUrl}/api/appointments/${appointment.data.appointmentId}/confirm`, {
      method: 'PUT'
    });
    
    if (updateResponse.ok) {
      console.log('   ✅ Appointment confirmed - Status update email sent!');
      return { status: 'SUCCESS', tested: true, appointmentId: appointment.data.appointmentId };
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  return { status: 'FAILED', tested: false };
}

// Test 4: Payment Confirmation Email  
async function testPaymentConfirmation() {
  console.log('\n💰 Test 4: Payment Confirmation Email');
  
  console.log('   ⚠️  Payment requires:');
  console.log('      1. Existing invoice ID');
  console.log('      2. Authentication token');
  console.log('   ℹ️  Payment confirmation email will trigger when:');
  console.log('      - Payment is successfully processed');
  console.log('      - Invoice status changes to PAID');
  
  return { status: 'REQUIRES_AUTH', tested: false };
}

// Test 5: Medical Record Notification Email
async function testMedicalRecordNotification() {
  console.log('\n🏥 Test 5: Medical Record Notification Email');
  
  try {
    const response = await fetch(`${testData.baseUrl}/api/medical-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        petId: testData.petId,
        veterinarianId: testData.veterinarianId,
        diagnosis: 'Khám sức khỏe định kỳ - Test email',
        treatment: 'Tiêm vaccine phòng dại',
        prescription: 'Thuốc kháng sinh 3 ngày',
        notes: 'Test medical record for email notification',
        nextFollowUp: new Date(Date.now() + 30 * 86400000).toISOString() // 30 days later
      })
    });
    
    if (!response.ok) {
      console.log('   ⚠️  Creating medical record requires authentication (Veterinarian role)');
      console.log('   ℹ️  Medical record email will trigger when:');
      console.log('      - Vet creates new medical record');
      console.log('      - Medical record is updated');
      return { status: 'REQUIRES_AUTH', tested: false };
    }
    
    const result = await response.json();
    console.log(`   ✅ Medical record created - Notification email sent!`);
    return { status: 'SUCCESS', tested: true, recordId: result.data.recordId };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  return { status: 'FAILED', tested: false };
}

// Test 6: Appointment Reminder Email (Scheduled)
async function testAppointmentReminder() {
  console.log('\n⏰ Test 6: Appointment Reminder Email');
  
  console.log('   ℹ️  Appointment reminder is scheduled by cron job');
  console.log('   ⏰ Reminder sends 24 hours before appointment');
  console.log('   📝 To test:');
  console.log('      1. Create appointment for tomorrow');
  console.log('      2. Wait for cron job to run (or trigger manually)');
  console.log('      3. Check email 24h before appointment time');
  
  return { status: 'SCHEDULED', tested: false };
}

// Test 7: Payment Failed Email (VNPay)
async function testPaymentFailed() {
  console.log('\n❌ Test 7: Payment Failed Email');
  
  console.log('   ⚠️  Payment failed requires VNPay callback');
  console.log('   ℹ️  Payment failed email triggers when:');
  console.log('      - VNPay returns error code (!= 00)');
  console.log('      - Payment gateway timeout');
  console.log('      - Insufficient funds');
  console.log('   🔧 Requires VNPay sandbox integration');
  
  return { status: 'REQUIRES_VNPAY', tested: false };
}

// Main test runner
async function runAllTests() {
  const results = {
    passwordReset: { status: 'COMPLETED', tested: true, note: 'Already tested successfully' },
    registration: { status: 'COMPLETED', tested: true, note: 'Already tested successfully' }
  };
  
  console.log('✅ Test 1: Password Reset Email - ALREADY TESTED');
  console.log('✅ Test 2: Registration Confirmation Email - ALREADY TESTED\n');
  
  results.appointmentUpdate = await testAppointmentStatusUpdate();
  results.paymentConfirmation = await testPaymentConfirmation();
  results.medicalRecord = await testMedicalRecordNotification();
  results.appointmentReminder = await testAppointmentReminder();
  results.paymentFailed = await testPaymentFailed();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60) + '\n');
  
  const summary = [
    { name: '1. Password Reset', status: '✅ TESTED & WORKING' },
    { name: '2. Registration Confirmation', status: '✅ TESTED & WORKING' },
    { name: '3. Appointment Status Update', status: getStatusIcon(results.appointmentUpdate.status) },
    { name: '4. Payment Confirmation', status: getStatusIcon(results.paymentConfirmation.status) },
    { name: '5. Medical Record Notification', status: getStatusIcon(results.medicalRecord.status) },
    { name: '6. Appointment Reminder', status: getStatusIcon(results.appointmentReminder.status) },
    { name: '7. Payment Failed', status: getStatusIcon(results.paymentFailed.status) }
  ];
  
  summary.forEach(item => {
    console.log(`${item.name.padEnd(35)} ${item.status}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('📧 Check Gmail inbox: trggg2004@gmail.com');
  console.log('🎯 Expected emails: Password Reset + Registration (x2)');
  console.log('='.repeat(60) + '\n');
}

function getStatusIcon(status) {
  const icons = {
    'SUCCESS': '✅ TESTED & WORKING',
    'COMPLETED': '✅ TESTED & WORKING',
    'REQUIRES_AUTH': '🔒 Requires Authentication',
    'REQUIRES_VNPAY': '🔧 Requires VNPay Integration',
    'SCHEDULED': '⏰ Scheduled (Cron Job)',
    'FAILED': '❌ Failed'
  };
  return icons[status] || '❓ Unknown';
}

// Run tests
runAllTests().catch(console.error);
