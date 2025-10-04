// test-certificate-quick.js
// Quick test for certificate on existing enrollment

const BASE_URL = 'http://localhost:4000';

async function testCertificate() {
  // 1. Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrPhone: 'john@example.com',
      password: 'password123'
    })
  });
  const { token } = await loginRes.json();
  
  // 2. Get enrollments
  const enrollRes = await fetch(`${BASE_URL}/api/progress`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { data } = await enrollRes.json();
  
  // Find enrollment with 100%
  const enrollment = data.enrollments.find(e => e.progress === 100);
  
  if (!enrollment) {
    console.log('❌ No completed enrollment found');
    return;
  }
  
  console.log(`✅ Found completed enrollment: ${enrollment.course.title}`);
  console.log(`   Progress: ${enrollment.progress}%`);
  console.log(`   Has certificate: ${enrollment.hasCertificate}`);
  console.log(`   Enrollment ID: ${enrollment.id}`);
  
  if (enrollment.hasCertificate && enrollment.certificate) {
    console.log(`   Serial Hash: ${enrollment.certificate.serialHash.substring(0, 16)}...`);
    
    // Get full certificate
    const certRes = await fetch(`${BASE_URL}/api/enrollments/${enrollment.id}/certificate`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const certData = await certRes.json();
    
    if (certData.success) {
      console.log('\n✅ Certificate retrieved:');
      console.log(`   Learner: ${certData.data.certificate.learner.name}`);
      console.log(`   Course: ${certData.data.certificate.course.title}`);
      console.log(`   Level: ${certData.data.certificate.course.level}`);
      console.log(`   Issued: ${certData.data.certificate.issuedAt}`);
      console.log(`   Verification URL: ${certData.data.certificate.verificationUrl}`);
      
      // Verify certificate
      const verifyRes = await fetch(certData.data.certificate.verificationUrl);
      const verifyData = await verifyRes.json();
      
      if (verifyData.success && verifyData.data.valid) {
        console.log('\n✅ Certificate verified successfully!');
      } else {
        console.log('\n❌ Certificate verification failed');
      }
    } else {
      console.log('\n❌ Failed to get certificate:', certData.message);
    }
  } else {
    console.log('\n⚠️  No certificate generated yet');
    console.log('   This enrollment was completed before certificate system was added');
    console.log('   Certificates are now auto-generated when progress reaches 100%');
  }
}

testCertificate().catch(console.error);
