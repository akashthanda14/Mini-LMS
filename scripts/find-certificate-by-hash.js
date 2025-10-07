// run: node scripts/find-certificate-by-hash.js <serialHash>
import dotenv from 'dotenv';
dotenv.config();
import prisma from '../lib/prisma.js';

const hash = process.argv[2];
if (!hash) {
  console.error('Usage: node scripts/find-certificate-by-hash.js <serialHash>');
  process.exit(2);
}

const run = async () => {
  try {
    const cert = await prisma.certificate.findUnique({
      where: { serialHash: hash },
      include: {
        enrollment: { include: { user: true, course: true } }
      }
    });
    if (!cert) {
      console.log('NOT FOUND');
    } else {
      console.log(JSON.stringify(cert, null, 2));
    }
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
};

run();
