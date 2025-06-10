import { db } from './client'; // your instantiated drizzle connection
import {
  users,
  passwords,
  courses,
  courseTranslations,
  languages,
  userImages,
  courseImages,
} from './schema';

import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

async function seed() {
  console.log('🌱 Starting seed...');

  // First insert language (for i18n)
  await db.insert(languages).values([
    { id: 'en', name: 'English' },
    { id: 'es', name: 'Spanish' },
    { id: 'fr', name: 'French' },
  ]).onConflictDoNothing();

  const passwordPlain = 'test1234';
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  // Insert a user
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
  });

  await db.insert(passwords).values({
    userId,
    hash: passwordHash,
  });

  // Add a course owned by user
  const courseId = randomUUID();
  await db.insert(courses).values({
    id: courseId,
    duration: 120,
    ownerId: userId,
  });

  // Add translations for that course
  await db.insert(courseTranslations).values([
    {
      courseId,
      languageId: 'en',
      title: 'Intro to TypeScript',
      description: 'Learn TS from scratch.',
      content: 'TypeScript basics, types, functions...',
      level: 'BEGINNER',
    },
    {
  courseId,
  languageId: 'es',
  title: 'Introducción a TypeScript',
  description: 'Aprende TypeScript desde cero.',
  content: 'Conceptos básicos de TypeScript...',
  level: 'BEGINNER',
},
    {
      courseId,
      languageId: 'fr',
      title: 'Introduction à TypeScript',
      description: 'Apprenez TS à partir de zéro.',
      content: 'Notions de base de TypeScript...',
      level: 'BEGINNER',
    },
  ]);

  // Insert dummy image blobs (⚠️: just random data for now)
  await db.insert(userImages).values({
    id: randomUUID(),
    userId,
    altText: 'User Profile Pic',
    contentType: 'image/png',
    blob: Buffer.from('FakeImageData', 'utf-8'),
  });

  await db.insert(courseImages).values({
    id: randomUUID(),
    courseId,
    altText: 'Course Cover',
    contentType: 'image/jpeg',
    blob: Buffer.from('CourseImageData', 'utf-8'),
  });

  console.log('✅ Seed completed');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
