// run: node scripts/check-certificate.js <enrollmentId>
import dotenv from 'dotenv';
dotenv.config();
import prisma from '../lib/prisma.js';
const id = process.argv[2];
if (!id) { console.error('Usage: node scripts/check-certificate.js <enrollmentId>'); process.exit(2); }

const run = async () => {
  const cert = await prisma.certificate.findFirst({ where: { enrollmentId: id } });
  console.log(cert ? JSON.stringify(cert, null, 2) : 'No certificate record found');
  process.exit(0);
};
run().catch(e=>{console.error(e);process.exit(1)});