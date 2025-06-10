import { db } from './client';
import {
  User,
  Password,
  Course,
  CourseTranslation,
  Language,
  UserImage,
  CourseImage,
  Role,
  Permission,
  RoleToUser,
  PermissionToRole,
} from './schema';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

async function seed() {
  console.log('🌱 Starting seed...');

  // 1. Seed languages
  await db.insert(Language).values([
    { id: 'en', name: 'English' },
    { id: 'es', name: 'Spanish' },
    { id: 'fr', name: 'French' },
  ]).onConflictDoNothing();

  // 2. Create a user
  const userId = randomUUID();
  const passwordHash = await bcrypt.hash('devtodev', 10);

  await db.insert(User).values({
    id: userId,
    email: 'deva@adapt.com',
    username: 'deva',
    name: 'Deva',
  });

  await db.insert(Password).values({
    userId,
    hash: passwordHash,
  });

  // 3. Create an admin role
  const roleId = randomUUID();
  await db.insert(Role).values({
    id: roleId,
    name: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 4. Link user to the role
  await db.insert(RoleToUser).values({
    userId,
    roleId,
  });

  // 5. Create permissions
  const permissions = [
		{ action: 'create', entity: 'course', access: 'any' },
		{ action: 'read', entity: 'course', access: 'any' },
		{ action: 'update', entity: 'course', access: 'any' },
		{ action: 'delete', entity: 'course', access: 'any' },

		{ action: 'create', entity: 'user', access: 'any' },
		{ action: 'read', entity: 'user', access: 'any' },
		{ action: 'update', entity: 'user', access: 'any' },
		{ action: 'delete', entity: 'user', access: 'any' },

		{ action: 'create', entity: 'role', access: 'any' },
		{ action: 'read', entity: 'role', access: 'any' },
		{ action: 'update', entity: 'role', access: 'any' },
		{ action: 'delete', entity: 'role', access: 'any' },

		{ action: 'create', entity: 'permission', access: 'any' },
		{ action: 'read', entity: 'permission', access: 'any' },
		{ action: 'update', entity: 'permission', access: 'any' },
		{ action: 'delete', entity: 'permission', access: 'any' },
  ];

  const now = new Date();

  const permissionRecords = permissions.map(p => ({
    id: randomUUID(),
    ...p,
    description: '',
    createdAt: now,
    updatedAt: now,
  }));

  await db.insert(Permission).values(permissionRecords);

  // 6. Link all permissions to the admin role
  const rolePermissionMappings = permissionRecords.map(p => ({
    id: randomUUID(),
    roleId,
    permissionId: p.id,
  }));

  await db.insert(PermissionToRole).values(rolePermissionMappings);

  // 7. Create a course
  const courseId = randomUUID();
  await db.insert(Course).values({
    id: courseId,
    duration: 120,
    ownerId: userId,
  });

  await db.insert(CourseTranslation).values([
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

  await db.insert(UserImage).values({
    id: randomUUID(),
    userId,
    altText: 'User Profile Pic',
    contentType: 'image/png',
    blob: Buffer.from('FakeImageData', 'utf-8'),
  });

  await db.insert(CourseImage).values({
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
