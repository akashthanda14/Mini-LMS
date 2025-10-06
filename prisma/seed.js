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

  // Course 3: Python for Data Science
  const course3 = await prisma.course.create({
    data: {
  creatorId: creator.id,
  title: 'Python for Data Science',
  description: 'Learn Python with real-world data science examples: data manipulation, visualization, and machine learning basics.',
  thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
  category: 'Programming',
  level: CourseLevel.INTERMEDIATE,
  duration: 360, // 6 hours total
  status: CourseStatus.DRAFT
    }
  });
  console.log(`✅ Course 3 created: ${course3.title}`);

  const course3Lesson1 = await prisma.lesson.create({
    data: {
      courseId: course3.id,
      title: 'Python Environment & pandas Basics',
      videoUrl: 'https://www.youtube.com/watch?v=vmEHCJofslg',
      transcript: 'Welcome to Python for Data Science. In this lesson we set up Python, install pandas, and work with data frames...',
      order: 1,
      duration: 60
    }
  });

  const course3Lesson2 = await prisma.lesson.create({
    data: {
      courseId: course3.id,
      title: 'Data Cleaning and Visualization',
      videoUrl: 'https://www.youtube.com/watch?v=LHBE6Q9XlzI',
      transcript: 'Data cleaning is a critical step. We will cover missing values, transformations, and visualizing data with matplotlib and seaborn...',
      order: 2,
      duration: 120
    }
  });

  const course3Lesson3 = await prisma.lesson.create({
    data: {
      courseId: course3.id,
      title: 'Intro to Machine Learning with scikit-learn',
      videoUrl: 'https://www.youtube.com/watch?v=Gv9_4yMHFhI',
      transcript: 'This lesson introduces basic machine learning workflows, training simple models, and evaluating their performance...',
      order: 3,
      duration: 180
    }
  });

  console.log(`  ✅ Added 3 lessons to Course 3\n`);

  // Course 4: Node.js Masterclass
  const course4 = await prisma.course.create({
    data: {
  creatorId: creator.id,
  title: 'Node.js Masterclass: Backend Development',
  description: 'Deep dive into Node.js and backend development: Express, databases, authentication, and deployment.',
  thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800',
  category: 'Programming',
  level: CourseLevel.ADVANCED,
  duration: 420, // 7 hours total
  status: CourseStatus.DRAFT
    }
  });
  console.log(`✅ Course 4 created: ${course4.title}`);

  const course4Lesson1 = await prisma.lesson.create({
    data: {
      courseId: course4.id,
      title: 'Node.js & Express Fundamentals',
      videoUrl: 'https://www.youtube.com/watch?v=TlB_eWDSMt4',
      transcript: 'Start with Node.js fundamentals, the event loop, and building HTTP servers with Express. We will create a simple REST API...',
      order: 1,
      duration: 90
    }
  });

  const course4Lesson2 = await prisma.lesson.create({
    data: {
      courseId: course4.id,
      title: 'Working with Databases and ORMs',
      videoUrl: 'https://www.youtube.com/watch?v=EN6Dx22cPRI',
      transcript: 'Learn to connect Node.js apps to databases, use ORMs (like Prisma), and write migrations and queries safely...',
      order: 2,
      duration: 120
    }
  });

  const course4Lesson3 = await prisma.lesson.create({
    data: {
      courseId: course4.id,
      title: 'Authentication, Testing, and Deployment',
      videoUrl: 'https://www.youtube.com/watch?v=6FOq4cUdH8k',
      transcript: 'We will cover JWT and session-based auth, essential testing strategies, and deploying Node.js apps to popular cloud platforms...',
      order: 3,
      duration: 210
    }
  });

  console.log(`  ✅ Added 3 lessons to Course 4\n`);
  // ---------- Bulk data generation: additional learners, creators, courses, lessons, enrollments ----------
  console.log('\n🔁 Generating additional test data (learners, creators, courses, lessons, enrollments)...\n');

  // Create additional learners up to 20 total (we already have 2)
  const extraLearners = [];
  for (let i = 3; i <= 20; i++) {
    const l = await prisma.user.create({
      data: {
        username: `learner${i}`,
        fullName: `Learner ${i}`,
        email: `learner${i}@example.com`,
        password: hashedPassword,
        role: UserRole.LEARNER,
        emailVerified: true,
        phoneNumber: `+10000000${String(i).padStart(2, '0')}`,
        phoneVerified: true,
        isProfileComplete: true,
        isActive: true,
        country: 'United States',
        state: 'CA',
        zip: '90001',
        bio: `Auto-generated learner ${i}`,
        lastLoginAt: new Date()
      }
    });
    extraLearners.push(l);
  }
  console.log(`  ✅ Created ${extraLearners.length} extra learners (total learners now: ${2 + extraLearners.length})`);

  // Create additional creators to reach 10 total (we already have 1)
  const extraCreators = [];
  for (let i = 2; i <= 10; i++) {
    const c = await prisma.user.create({
      data: {
        username: `creator${i}`,
        fullName: `Creator ${i}`,
        email: `creator${i}@example.com`,
        password: hashedPassword,
        role: UserRole.CREATOR,
        emailVerified: true,
        phoneNumber: `+20000000${String(i).padStart(2, '0')}`,
        phoneVerified: true,
        isProfileComplete: true,
        isActive: true,
        country: 'United States',
        state: 'NY',
        zip: '10001',
        bio: `Auto-generated creator ${i}`,
        avatar: `https://i.pravatar.cc/150?u=creator${i}`,
        lastLoginAt: new Date()
      }
    });

    await prisma.creatorApplication.create({
      data: {
        userId: c.id,
        bio: `Auto-approved application for ${c.fullName}`,
        portfolio: `https://creator${i}.example.com`,
        experience: '5 years teaching and development',
        status: CreatorApplicationStatus.APPROVED,
        reviewedBy: admin.id,
        reviewedAt: new Date()
      }
    });

    extraCreators.push(c);
  }
  console.log(`  ✅ Created ${extraCreators.length} extra creators (total creators now: ${1 + extraCreators.length})`);

  const allCreators = [creator, ...extraCreators];

  // Titles and thumbnails pool for additional courses
  const additionalCourseData = [
    { title: 'Advanced TypeScript', level: CourseLevel.ADVANCED, thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800' },
    { title: 'Data Structures & Algorithms', level: CourseLevel.INTERMEDIATE, thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800' },
    { title: 'SQL & Databases', level: CourseLevel.INTERMEDIATE, thumbnail: 'https://images.unsplash.com/photo-1555066931-8a1f5b8e9f3b?w=800' },
    { title: 'Docker & Containerization', level: CourseLevel.INTERMEDIATE, thumbnail: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800' },
    { title: 'Kubernetes from Zero', level: CourseLevel.ADVANCED, thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800' },
    { title: 'Go Programming: Systems Programming', level: CourseLevel.ADVANCED, thumbnail: 'https://images.unsplash.com/photo-1526378721756-9b9d3f36f0b6?w=800' },
    { title: 'C# and .NET Core', level: CourseLevel.INTERMEDIATE, thumbnail: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800' },
    { title: 'DevOps Fundamentals', level: CourseLevel.INTERMEDIATE, thumbnail: 'https://images.unsplash.com/photo-1526378721756-9b9d3f36f0b6?w=800' },
    { title: 'Machine Learning Practical', level: CourseLevel.ADVANCED, thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800' },
    { title: 'Front-end Performance Optimization', level: CourseLevel.INTERMEDIATE, thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800' },
    { title: 'Fullstack Project: Build & Deploy', level: CourseLevel.INTERMEDIATE, thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800' }
  ];

  // Create additional courses to reach 15 total (we already have 4)
  const createdAdditionalCourses = [];
  for (let i = 0; i < additionalCourseData.length; i++) {
    const info = additionalCourseData[i];
    // assign Sarah (creator) as owner for all additional courses
    const c = await prisma.course.create({
      data: {
        creatorId: creator.id,
        title: info.title,
        description: `${info.title} - auto-generated course description for seed data.`,
        thumbnail: info.thumbnail,
        category: 'Programming',
        level: info.level,
        duration: 180 + i * 30,
        status: CourseStatus.DRAFT
      }
    });

    const lessons = [];
    for (let j = 1; j <= 3; j++) {
      const lesson = await prisma.lesson.create({
        data: {
          courseId: c.id,
          title: `${c.title} - Lesson ${j}`,
          videoUrl: `https://www.youtube.com/watch?v=seed${i}${j}`,
          transcript: `Transcript for ${c.title} - Lesson ${j}`,
          order: j,
          duration: 30 + j * 15
        }
      });
      lessons.push(lesson);
    }

  createdAdditionalCourses.push({ course: c, lessons });
  console.log(`  ✅ Created course: ${c.title} (creator: ${creator.email}) as DRAFT with 3 lessons`);
  }

  // Enroll each learner in up to 3 random courses
  const allLearners = [learner1, learner2, ...extraLearners];
  const allCourses = [course1, course2, course3, course4, ...createdAdditionalCourses.map(x => x.course)];
  let enrollmentsCreated = 0;
  for (const l of allLearners) {
    const picks = new Set();
    while (picks.size < 3) picks.add(Math.floor(Math.random() * allCourses.length));
    for (const idx of picks) {
      const courseToEnroll = allCourses[idx];
      try {
        await prisma.enrollment.create({
          data: {
            userId: l.id,
            courseId: courseToEnroll.id,
            progress: Math.floor(Math.random() * 101),
            enrolledAt: new Date()
          }
        });
        enrollmentsCreated++;
      } catch (e) {
        // ignore unique constraint errors
      }
    }
  }
  console.log(`\n  ✅ Created ~${enrollmentsCreated} enrollments (each learner enrolled in up to 3 courses)`);

  // Summary (dynamic counts)
  console.log('\n✨ Database seeding complete. Final counts from DB:');
  const totalUsers = await prisma.user.count();
  const totalLearners = await prisma.user.count({ where: { role: UserRole.LEARNER } });
  const totalCreators = await prisma.user.count({ where: { role: UserRole.CREATOR } });
  const totalCourses = await prisma.course.count();
  const totalLessons = await prisma.lesson.count();
  const totalEnrollments = await prisma.enrollment.count();
  const totalCertificates = await prisma.certificate.count();

  console.log(`  - Users: ${totalUsers}`);
  console.log(`  - Learners: ${totalLearners}`);
  console.log(`  - Creators: ${totalCreators}`);
  console.log(`  - Courses: ${totalCourses}`);
  console.log(`  - Lessons: ${totalLessons}`);
  console.log(`  - Enrollments: ${totalEnrollments}`);
  console.log(`  - Certificates: ${totalCertificates}\n`);

  console.log('🔑 Login credentials for seeded users:');
  console.log('  Password for all seeded users: password123\n');
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
