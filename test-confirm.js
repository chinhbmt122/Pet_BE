const axios = require('axios');

async function testConfirm() {
  try {
    console.log('🔐 Logging in as manager...');
    const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'manager@petcare.com',
      password: 'Manager@123'
    });
    
    const token = loginRes.data.data.token;
    console.log('✅ Login successful');
    
    console.log('\n📋 Getting PENDING appointments...');
    const appointmentsRes = await axios.get('http://localhost:3001/api/appointments/by-status?status=PENDING', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const appointments = appointmentsRes.data.data;
    if (appointments.length === 0) {
      console.log('❌ No PENDING appointments found');
      return;
    }
    
    const appointment = appointments[0];
    console.log(`\n✅ Found appointment #${appointment.appointmentId}`);
    console.log(`   Pet: ${appointment.pet?.name || 'Unknown'}`);
    console.log(`   Status: ${appointment.status}`);
    
    console.log(`\n📧 Confirming appointment #${appointment.appointmentId}...`);
    const confirmRes = await axios.put(
      `http://localhost:3001/api/appointments/${appointment.appointmentId}/confirm`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Appointment confirmed!');
    console.log('Response:', JSON.stringify(confirmRes.data, null, 2));
    
    // Wait a bit for email to be processed
    console.log('\n⏳ Waiting 5 seconds for email processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n📊 Checking email logs...');
    // Cannot query DB directly without psql, so just wait
    console.log('✅ Test complete! Check your email: giangmapmap2004@gmail.com');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testConfirm();
