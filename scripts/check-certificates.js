import prisma from '../lib/prisma.js';

(async () => {
  try {
    const rows = await prisma.enrollment.findMany({
      where: { progress: 100 },
      include: {
        certificate: true,
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } }
      },
      orderBy: { completedAt: 'desc' },
      take: 50
    });

    console.log(JSON.stringify(rows.map(r => ({
      enrollmentId: r.id,
      user: r.user,
      course: r.course,
      completedAt: r.completedAt,
      certificate: r.certificate ? { id: r.certificate.id, serialHash: r.certificate.serialHash, issuedAt: r.certificate.issuedAt } : null
    })), null, 2));

    await prisma.$disconnect();
  } catch (e) {
    console.error('Error', e.message);
    try { await prisma.$disconnect(); } catch (err) {}
    process.exit(1);
  }
})();
