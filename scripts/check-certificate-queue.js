// run: node scripts/check-certificate-queue.js [enrollmentId]
import dotenv from 'dotenv';
dotenv.config();
import { certificateQueue } from '../config/queue.js';

const enrollmentIdArg = process.argv[2];

const fmt = (job) => ({ id: job.id, name: job.name, data: job.data, attemptsMade: job.attemptsMade, finishedOn: job.finishedOn });

const run = async () => {
  try {
    const counts = await certificateQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
    console.log('Job counts:', counts);

    const waiting = await certificateQueue.getJobs(['waiting'], 0, 50);
    const active = await certificateQueue.getJobs(['active'], 0, 50);
    const completed = await certificateQueue.getJobs(['completed'], 0, 50);
    const failed = await certificateQueue.getJobs(['failed'], 0, 50);
    const delayed = await certificateQueue.getJobs(['delayed'], 0, 50);

    console.log('\n--- Waiting Jobs ---');
    waiting.forEach(j => console.log(JSON.stringify(fmt(j), null, 2)));

    console.log('\n--- Active Jobs ---');
    active.forEach(j => console.log(JSON.stringify(fmt(j), null, 2)));

    console.log('\n--- Delayed Jobs ---');
    delayed.forEach(j => console.log(JSON.stringify(fmt(j), null, 2)));

    console.log('\n--- Completed Jobs (recent) ---');
    completed.slice(0,20).forEach(j => console.log(JSON.stringify(fmt(j), null, 2)));

    console.log('\n--- Failed Jobs (recent) ---');
    failed.slice(0,20).forEach(j => console.log(JSON.stringify(fmt(j), null, 2)));

    if (enrollmentIdArg) {
      console.log(`\nSearching jobs for enrollmentId=${enrollmentIdArg}`);
      const all = [...waiting, ...active, ...delayed, ...completed, ...failed];
      const match = all.filter(j => j.data && j.data.enrollmentId === enrollmentIdArg);
      if (match.length === 0) console.log('No job found for enrollmentId');
      else match.forEach(j => console.log('Found job:', JSON.stringify(fmt(j), null, 2)));
    }

    process.exit(0);
  } catch (err) {
    console.error('Error checking certificate queue:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
};

run();
