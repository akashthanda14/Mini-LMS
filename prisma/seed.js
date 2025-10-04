import { PrismaClient, UserRole, CreatorApplicationStatus, CourseStatus, CourseLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Clear existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.lessonProgress.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.creatorApplication.deleteMany();
  await prisma.emailOTP.deleteMany();
  await prisma.phoneOTP.deleteMany();
  await prisma.user.deleteMany();

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 12);

  // 1. Create Admin
  console.log('👑 Creating admin user...');
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      fullName: 'System Administrator',
      email: 'admin@microcourses.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      emailVerified: true,
      phoneNumber: '+1234567890',
      phoneVerified: true,
      isProfileComplete: true,
      isActive: true,
      country: 'United States',
      state: 'California',
      zip: '94102',
      bio: 'System administrator managing the MicroCourses platform.',
      lastLoginAt: new Date()
    }
  });
  console.log(`✅ Admin created: ${admin.email}\n`);

  // 2. Create 2 Learners
  console.log('👨‍🎓 Creating learner users...');
  
  const learner1 = await prisma.user.create({
    data: {
      username: 'john_learner',
      fullName: 'John Smith',
      email: 'john@example.com',
      password: hashedPassword,
      role: UserRole.LEARNER,
      emailVerified: true,
      phoneNumber: '+1234567891',
      phoneVerified: true,
      isProfileComplete: true,
      isActive: true,
      country: 'United States',
      state: 'New York',
      zip: '10001',
      bio: 'Passionate learner interested in web development and data science.',
      lastLoginAt: new Date()
    }
  });
  console.log(`✅ Learner 1 created: ${learner1.email}`);

  const learner2 = await prisma.user.create({
    data: {
      username: 'emma_student',
      fullName: 'Emma Johnson',
      email: 'emma@example.com',
      password: hashedPassword,
      role: UserRole.LEARNER,
      emailVerified: true,
      phoneNumber: '+1234567892',
      phoneVerified: true,
      isProfileComplete: true,
      isActive: true,
      country: 'Canada',
      state: 'Ontario',
      zip: 'M5V 3A8',
      bio: 'Self-taught developer eager to expand my knowledge.',
      lastLoginAt: new Date(Date.now() - 86400000) // 1 day ago
    }
  });
  console.log(`✅ Learner 2 created: ${learner2.email}\n`);

  // 3. Create 1 Approved Creator with Application
  console.log('🎨 Creating creator user...');
  
  const creator = await prisma.user.create({
    data: {
      username: 'sarah_creator',
      fullName: 'Sarah Williams',
      email: 'sarah@example.com',
      password: hashedPassword,
      role: UserRole.CREATOR,
      emailVerified: true,
      phoneNumber: '+1234567893',
      phoneVerified: true,
      isProfileComplete: true,
      isActive: true,
      country: 'United Kingdom',
      state: 'London',
      zip: 'SW1A 1AA',
      bio: 'Senior software engineer with 10+ years of experience in full-stack development.',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
      lastLoginAt: new Date()
    }
  });

  const creatorApp = await prisma.creatorApplication.create({
    data: {
      userId: creator.id,
      bio: 'I have been working in software development for over 10 years, specializing in JavaScript, React, Node.js, and cloud technologies. I have mentored over 50 junior developers and love teaching.',
      portfolio: 'https://sarahwilliams.dev',
      experience: 'Senior Software Engineer at TechCorp (5 years), Full Stack Developer at StartupX (3 years), Freelance Developer (2 years). Created 15+ production applications and contributed to open source.',
      status: CreatorApplicationStatus.APPROVED,
      reviewedBy: admin.id,
      reviewedAt: new Date(Date.now() - 7 * 86400000) // 7 days ago
    }
  });
  console.log(`✅ Creator created: ${creator.email}`);
  console.log(`✅ Creator application approved\n`);

  // 4. Create 2 Published Courses with 3 Lessons each
  console.log('📚 Creating courses and lessons...\n');

  // Course 1: JavaScript Fundamentals
  const course1 = await prisma.course.create({
    data: {
      creatorId: creator.id,
      title: 'JavaScript Fundamentals for Beginners',
      description: 'Master the basics of JavaScript programming from scratch. Learn variables, functions, loops, and more in this comprehensive beginner course.',
      thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800',
      category: 'Programming',
      level: CourseLevel.BEGINNER,
      duration: 240, // 4 hours total
      status: CourseStatus.PUBLISHED,
      submittedAt: new Date(Date.now() - 14 * 86400000), // 14 days ago
      publishedAt: new Date(Date.now() - 10 * 86400000)  // 10 days ago
    }
  });
  console.log(`✅ Course 1 created: ${course1.title}`);

  // Course 1 - Lessons
  const course1Lesson1 = await prisma.lesson.create({
    data: {
      courseId: course1.id,
      title: 'Introduction to JavaScript and Setup',
      videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
      transcript: 'Welcome to JavaScript Fundamentals! In this lesson, we will cover what JavaScript is, why it is important, and how to set up your development environment...',
      order: 1,
      duration: 45 // 45 minutes
    }
  });

  const course1Lesson2 = await prisma.lesson.create({
    data: {
      courseId: course1.id,
      title: 'Variables, Data Types, and Operators',
      videoUrl: 'https://www.youtube.com/watch?v=edlFjlzxkSI',
      transcript: 'In this lesson, we explore JavaScript variables using var, let, and const. We will learn about different data types including strings, numbers, booleans, and objects...',
      order: 2,
      duration: 60 // 60 minutes
    }
  });

  const course1Lesson3 = await prisma.lesson.create({
    data: {
      courseId: course1.id,
      title: 'Functions and Control Flow',
      videoUrl: 'https://www.youtube.com/watch?v=N8ap4k_1QEQ',
      transcript: 'Functions are the building blocks of JavaScript. Learn how to create reusable code with functions, understand control flow with if-else statements, loops, and more...',
      order: 3,
      duration: 75 // 75 minutes
    }
  });

  console.log(`  ✅ Added 3 lessons to Course 1\n`);

  // Course 2: React for Beginners
  const course2 = await prisma.course.create({
    data: {
      creatorId: creator.id,
      title: 'React for Beginners: Build Modern Web Apps',
      description: 'Learn React.js from the ground up. Build interactive user interfaces with components, hooks, and state management.',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      category: 'Web Development',
      level: CourseLevel.INTERMEDIATE,
      duration: 300, // 5 hours total
      status: CourseStatus.PUBLISHED,
      submittedAt: new Date(Date.now() - 7 * 86400000),  // 7 days ago
      publishedAt: new Date(Date.now() - 5 * 86400000)   // 5 days ago
    }
  });
  console.log(`✅ Course 2 created: ${course2.title}`);

  // Course 2 - Lessons
  const course2Lesson1 = await prisma.lesson.create({
    data: {
      courseId: course2.id,
      title: 'Getting Started with React',
      videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPg',
      transcript: 'React is a powerful JavaScript library for building user interfaces. In this lesson, we will set up our React development environment and create our first component...',
      order: 1,
      duration: 50 // 50 minutes
    }
  });

  const course2Lesson2 = await prisma.lesson.create({
    data: {
      courseId: course2.id,
      title: 'Components, Props, and State',
      videoUrl: 'https://www.youtube.com/watch?v=4UZrsTqkcW4',
      transcript: 'Understanding components is crucial in React. Learn about functional and class components, how to pass data with props, and manage component state...',
      order: 2,
      duration: 90 // 90 minutes
    }
  });

  const course2Lesson3 = await prisma.lesson.create({
    data: {
      courseId: course2.id,
      title: 'React Hooks and Side Effects',
      videoUrl: 'https://www.youtube.com/watch?v=O6P86uwfdR0',
      transcript: 'React Hooks revolutionized how we write React components. Master useState, useEffect, and other essential hooks to build powerful applications...',
      order: 3,
      duration: 100 // 100 minutes
    }
  });

  console.log(`  ✅ Added 3 lessons to Course 2\n`);

  // 5. Create Enrollments for Learners
  console.log('📝 Creating enrollments...\n');

  // Learner 1 enrolls in Course 1 and completes it
  const enrollment1 = await prisma.enrollment.create({
    data: {
      userId: learner1.id,
      courseId: course1.id,
      progress: 100,
      enrolledAt: new Date(Date.now() - 8 * 86400000), // 8 days ago
      completedAt: new Date(Date.now() - 2 * 86400000), // 2 days ago
      lastAccessedAt: new Date(Date.now() - 2 * 86400000)
    }
  });

  // Create lesson progress for Course 1 (all completed)
  await prisma.lessonProgress.createMany({
    data: [
      {
        enrollmentId: enrollment1.id,
        lessonId: course1Lesson1.id,
        completed: true,
        watchedAt: new Date(Date.now() - 8 * 86400000)
      },
      {
        enrollmentId: enrollment1.id,
        lessonId: course1Lesson2.id,
        completed: true,
        watchedAt: new Date(Date.now() - 5 * 86400000)
      },
      {
        enrollmentId: enrollment1.id,
        lessonId: course1Lesson3.id,
        completed: true,
        watchedAt: new Date(Date.now() - 2 * 86400000)
      }
    ]
  });

  // Generate certificate for completed course
  const certificateHash = crypto
    .createHash('sha256')
    .update(`${learner1.id}-${course1.id}-${Date.now()}`)
    .digest('hex');

  await prisma.certificate.create({
    data: {
      enrollmentId: enrollment1.id,
      userId: learner1.id,
      courseId: course1.id,
      serialHash: certificateHash,
      issuedAt: new Date(Date.now() - 2 * 86400000)
    }
  });

  console.log(`✅ Learner 1 enrolled in Course 1 (Completed with Certificate)`);

  // Learner 1 enrolls in Course 2 (in progress)
  const enrollment2 = await prisma.enrollment.create({
    data: {
      userId: learner1.id,
      courseId: course2.id,
      progress: 33,
      enrolledAt: new Date(Date.now() - 3 * 86400000), // 3 days ago
      lastAccessedAt: new Date()
    }
  });

  await prisma.lessonProgress.create({
    data: {
      enrollmentId: enrollment2.id,
      lessonId: course2Lesson1.id,
      completed: true,
      watchedAt: new Date(Date.now() - 3 * 86400000)
    }
  });

  console.log(`✅ Learner 1 enrolled in Course 2 (In Progress - 33%)`);

  // Learner 2 enrolls in Course 2 (in progress)
  const enrollment3 = await prisma.enrollment.create({
    data: {
      userId: learner2.id,
      courseId: course2.id,
      progress: 66,
      enrolledAt: new Date(Date.now() - 4 * 86400000), // 4 days ago
      lastAccessedAt: new Date(Date.now() - 1 * 86400000) // 1 day ago
    }
  });

  await prisma.lessonProgress.createMany({
    data: [
      {
        enrollmentId: enrollment3.id,
        lessonId: course2Lesson1.id,
        completed: true,
        watchedAt: new Date(Date.now() - 4 * 86400000)
      },
      {
        enrollmentId: enrollment3.id,
        lessonId: course2Lesson2.id,
        completed: true,
        watchedAt: new Date(Date.now() - 1 * 86400000)
      }
    ]
  });

  console.log(`✅ Learner 2 enrolled in Course 2 (In Progress - 66%)\n`);

  console.log('✨ Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log('  - 1 Admin');
  console.log('  - 2 Learners');
  console.log('  - 1 Approved Creator');
  console.log('  - 2 Published Courses');
  console.log('  - 6 Lessons (3 per course)');
  console.log('  - 3 Enrollments');
  console.log('  - 1 Certificate\n');
  console.log('🔑 Login credentials for all users:');
  console.log('  Password: password123\n');
  console.log('👤 User Accounts:');
  console.log('  Admin:    admin@microcourses.com');
  console.log('  Learner1: john@example.com');
  console.log('  Learner2: emma@example.com');
  console.log('  Creator:  sarah@example.com\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
