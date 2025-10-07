// manual-certificate-gen.js
// Manually generate certificate for existing completed enrollment

import dotenv from 'dotenv';
dotenv.config();

import { generateCertificate } from '../services/certificateService.js';

// Usage:
//   node scripts/manual-certificate-gen.js <enrollmentId>
// If no enrollmentId is provided, the script will exit with usage instructions.
const enrollmentId = process.argv[2];

if (!enrollmentId) {
  console.error('Usage: node scripts/manual-certificate-gen.js <enrollmentId>');
  process.exit(2);
}

console.log(`Generating certificate for enrollment ${enrollmentId}...`);
try {
  const certificate = await generateCertificate(enrollmentId);
  console.log('✅ Certificate generated successfully!');
  console.log(`   Certificate ID: ${certificate.id}`);
  console.log(`   Serial Hash: ${certificate.serialHash}`);
  console.log(`   Issued At: ${certificate.issuedAt}`);
} catch (error) {
  console.error('❌ Error:', error.message);
  if (error.stack) console.error(error.stack);
  process.exitCode = 1;
}

process.exit(0);
