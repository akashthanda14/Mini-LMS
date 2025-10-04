// manual-certificate-gen.js
// Manually generate certificate for existing completed enrollment

import dotenv from 'dotenv';
dotenv.config();

import { generateCertificate } from '../services/certificateService.js';

const enrollmentId = '249615e3-3cd4-4bab-81ca-0e1645ebd2f7';

console.log('Generating certificate...');
try {
  const certificate = await generateCertificate(enrollmentId);
  console.log('✅ Certificate generated successfully!');
  console.log(`   Certificate ID: ${certificate.id}`);
  console.log(`   Serial Hash: ${certificate.serialHash}`);
  console.log(`   Issued At: ${certificate.issuedAt}`);
} catch (error) {
  console.error('❌ Error:', error.message);
}

process.exit(0);
