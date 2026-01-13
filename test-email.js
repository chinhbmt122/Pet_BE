// Quick test script to check if email system is working
const fetch = require('node-fetch');

async function testConfirmEmail() {
  console.log('🔍 Finding a PENDING appointment to test...');
  
  // Login as manager
  const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'manager@petcare.com',
      password: 'Manager@123'
    })
  });
  
  if (!loginResponse.ok) {
    console.error('❌ Login failed');
    return;
  }
  
  const { access_token } = await loginResponse.json();
  console.log('✅ Logged in as manager');
  
  // Get appointments
  const appointmentsResponse = await fetch('http://localhost:3001/api/appointments?status=PENDING', {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });
  
  const appointments = await appointmentsResponse.json();
  
  if (!appointments.data || appointments.data.length === 0) {
    console.log('⚠️  No PENDING appointments found');
    return;
  }
  
  const appointment = appointments.data[0];
  console.log(`\n📋 Found appointment #${appointment.appointmentId}`);
  console.log(`   Pet: ${appointment.pet?.name}`);
  console.log(`   Owner: ${appointment.pet?.owner?.fullName}`);
  console.log(`   Email: ${appointment.pet?.owner?.account?.email}`);
  
  // Confirm appointment
  console.log(`\n⏳ Confirming appointment #${appointment.appointmentId}...`);
  
  const confirmResponse = await fetch(`http://localhost:3001/api/appointments/${appointment.appointmentId}/confirm`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${access_token}` }
  });
  
  if (confirmResponse.ok) {
    console.log('✅ Appointment confirmed successfully!');
    console.log(`\n📧 Email should be sent to: ${appointment.pet?.owner?.account?.email}`);
    console.log('\n💡 Please check:');
    console.log('   1. Backend terminal logs for [CONFIRM] and [EMAIL SERVICE]');
    console.log('   2. Email inbox: ' + appointment.pet?.owner?.account?.email);
    console.log('   3. Database: SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 1;');
  } else {
    console.error('❌ Failed to confirm:', await confirmResponse.text());
  }
}

testConfirmEmail().catch(console.error);
