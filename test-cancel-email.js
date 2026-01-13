const axios = require('axios');

async function testCancelEmail() {
  try {
    console.log('🔐 Logging in as receptionist...');
    const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'receptionist@petcare.com',
      password: 'Reception@123'
    });
    
    const token = loginRes.data.data.accessToken;
    console.log('✅ Login successful\n');
    
    // Get a CONFIRMED appointment to cancel
    console.log('📋 Getting CONFIRMED appointments...');
    const appointmentsRes = await axios.get('http://localhost:3001/api/appointments/by-status?status=CONFIRMED', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const appointments = appointmentsRes.data.data;
    if (appointments.length === 0) {
      console.log('❌ No CONFIRMED appointments found');
      console.log('ℹ️  Tạo appointment mới hoặc confirm một appointment PENDING trước');
      return;
    }
    
    const appointment = appointments[0];
    console.log(`✅ Found appointment #${appointment.appointmentId}`);
    console.log(`   Pet: ${appointment.pet?.name || 'Unknown'}`);
    console.log(`   Owner: ${appointment.pet?.owner?.fullName || 'Unknown'}`);
    console.log(`   Email: ${appointment.pet?.owner?.account?.email || 'Unknown'}`);
    console.log(`   Status: ${appointment.status}\n`);
    
    console.log(`🚫 Canceling appointment #${appointment.appointmentId}...`);
    const cancelRes = await axios.put(
      `http://localhost:3001/api/appointments/${appointment.appointmentId}/cancel`,
      { reason: 'Test email notification - Thú cưng không thể đến' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Appointment canceled successfully!');
    console.log(`\n📧 Email cancellation notification should be sent to: ${appointment.pet?.owner?.account?.email}`);
    console.log('\n⏳ Waiting 5 seconds for email processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n✅ Test complete! Check your email inbox.');
    console.log(`📬 Expected email subject: "Cập nhật lịch hẹn - PAW LOVERS"`);
    console.log(`📄 Expected content: "Lịch hẹn đã bị hủy"`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Backend có thể đã restart. Thử lại với credentials khác:');
      console.log('   - Email: manager@petcare.com, Password: Manager@123');
      console.log('   - Email: receptionist@petcare.com, Password: Reception@123');
    }
  }
}

testCancelEmail();
