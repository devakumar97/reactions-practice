import { eq, and } from 'drizzle-orm';
import { db } from './client'; // your drizzle db instance
import {
  users,
  userImages,
  passwords,
  roles,
  permissions,
  userToRole,
  roleToPermission,
  connections,
  courses,
  courseImages,
  courseTranslations,
  languages,
} from './schema'; // your Drizzle schema exports
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config'; // ensures .env is loaded


// Helper to create hashed password (mocked here)
function createPasswordHash(plain: string) {
  // TODO: use bcrypt or whatever you prefer for real hashing
  return `hashed_${plain}`;
}

async function seed() {
  console.log('🌱 Seeding with Drizzle ORM...');
  
  // 1. Roles setup
  const roleData = [
    { id: uuidv4(), name: 'user', description: 'Regular user role' },
    { id: uuidv4(), name: 'admin', description: 'Admin role with all permissions' },
  ];

  // Insert roles if not exist
  for (const role of roleData) {
    const existingRole = await db.select().from(roles).where(eq(roles.name, role.name)).limit(1);
    if (existingRole.length === 0) {
      await db.insert(roles).values(role);
    } else {
      role.id = existingRole[0].id; // reuse existing id
    }
  }

  // 2. Permissions setup
  const permissionList = [
    // user own access
    { action: 'create', entity: 'note', access: 'own' },
    { action: 'read', entity: 'note', access: 'own' },
    { action: 'update', entity: 'note', access: 'own' },
    { action: 'delete', entity: 'note', access: 'own' },
    { action: 'create', entity: 'course', access: 'own' },
    { action: 'read', entity: 'course', access: 'own' },
    { action: 'update', entity: 'course', access: 'own' },
    { action: 'delete', entity: 'course', access: 'own' },

    // admin any access
    { action: 'create', entity: 'note', access: 'any' },
    { action: 'read', entity: 'note', access: 'any' },
    { action: 'update', entity: 'note', access: 'any' },
    { action: 'delete', entity: 'note', access: 'any' },

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

  // Insert permissions if not exist & collect all
  const allPermissions = [];
  for (const p of permissionList) {
    const existing = await db.select().from(permissions)
      .where(
        and(
          eq(permissions.action, p.action),
          eq(permissions.entity, p.entity),
          eq(permissions.access, p.access)
        )
      ).limit(1);
    if (existing.length === 0) {
      const id = uuidv4();
      await db.insert(permissions).values({
        id,
        action: p.action,
        entity: p.entity,
        access: p.access,
        description: '',
      });
      allPermissions.push({ ...p, id });
    } else {
      allPermissions.push(existing[0]);
    }
  }

  // Link permissions to roles
  // For 'user' role: only 'own' access permissions
  const userRole = roleData.find(r => r.name === 'user')!;
  const userPerms = allPermissions.filter(p => p.access === 'own');

  for (const perm of userPerms) {
    const exists = await db.select().from(roleToPermission)
      .where(
        and(
          eq(roleToPermission.roleId, userRole.id),
          eq(roleToPermission.permissionId, perm.id)
        )
      ).limit(1);
    if (exists.length === 0) {
      await db.insert(roleToPermission).values({
        roleId: userRole.id,
        permissionId: perm.id,
      });
    }
  }

  // For 'admin' role: all permissions
  const adminRole = roleData.find(r => r.name === 'admin')!;
  for (const perm of allPermissions) {
    const exists = await db.select().from(roleToPermission)
      .where(
        and(
          eq(roleToPermission.roleId, adminRole.id),
          eq(roleToPermission.permissionId, perm.id)
        )
      ).limit(1);
    if (exists.length === 0) {
      await db.insert(roleToPermission).values({
        roleId: adminRole.id,
        permissionId: perm.id,
      });
    }
  }

  // 3. Create some users + userImages + passwords + assign roles
  const totalUsers = 5;

  for (let i = 0; i < totalUsers; i++) {
    const id = uuidv4();
    const username = faker.internet.userName().toLowerCase();
    const email = faker.internet.email().toLowerCase();

    // Create user
    await db.insert(users).values({
      id,
      email,
      username,
      name: faker.person.fullName(),
    });

    // Create user image (fake blob for demo)
    const imgId = uuidv4();
    await db.insert(userImages).values({
      id: imgId,
      altText: `Profile image for ${username}`,
      contentType: 'image/png',
      blob: Buffer.from(`fake-image-${username}`), // replace with real img binary if you want
      userId: id,
    });

    // Create password
    await db.insert(passwords).values({
      userId: id,
      hash: createPasswordHash(username),
    });

    // Assign user role
    await db.insert(userToRole).values({
      userId: id,
      roleId: userRole.id,
    });
  }

  // 4. Create an admin user "deva" with roles and connection
  const adminUserId = uuidv4();
  await db.insert(users).values({
    id: adminUserId,
    email: 'deva@adpt.dev',
    username: 'deva',
    name: 'Deva',
  });

  // Admin user image
  const devaImageId = uuidv4();
  await db.insert(userImages).values({
    id: devaImageId,
    altText: 'Deva profile image',
    contentType: 'image/png',
    blob: Buffer.from('fake-deva-image-content'), // replace with actual buffer data
    userId: adminUserId,
  });

  // Admin password
  await db.insert(passwords).values({
    userId: adminUserId,
    hash: createPasswordHash('devtodev'),
  });

  // Assign admin + user roles
  await db.insert(userToRole).values([
    { userId: adminUserId, roleId: userRole.id },
    { userId: adminUserId, roleId: adminRole.id },
  ]);

  // Add a GitHub connection (fake data)
  await db.insert(connections).values({
    id: uuidv4(),
    userId: adminUserId,
    providerName: 'github',
    providerId: 'github-profile-id-from-mock', // Replace with actual id if needed
  });

  // 5. Create languages for courses (if not exist)
  const langs = [
    { id: 'en', name: 'English' },
    { id: 'es', name: 'Español' },
    { id: 'fr', name: 'Français' },
  ];
  for (const lang of langs) {
    const exists = await db.select().from(languages).where(eq(languages.id, lang.id)).limit(1);
    if (exists.length === 0) {
      await db.insert(languages).values(lang);
    }
  }

  // 6. Create courses + translations + images for admin user
  const coursesData = [
    {
      id: uuidv4(),
      ownerId: adminUserId,
      imageAltText: 'Course 1 Image',
      imageContent: Buffer.from('fake-course-1-image'),
      translations: [
        {
          languageId: 'en',
          title: 'Introduction to Drizzle ORM',
          description: 'Learn how to use Drizzle ORM with TypeScript.',
        },
        {
          languageId: 'es',
          title: 'Introducción a Drizzle ORM',
          description: 'Aprende a usar Drizzle ORM con TypeScript.',
        },
      ],
    },
    {
      id: uuidv4(),
      ownerId: adminUserId,
      imageAltText: 'Course 2 Image',
      imageContent: Buffer.from('fake-course-2-image'),
      translations: [
        {
          languageId: 'en',
          title: 'Advanced MERN Stack Development',
          description: 'Master the MERN stack for fullstack projects.',
        },
        {
          languageId: 'fr',
          title: 'Développement MERN avancé',
          description: 'Maîtrisez la pile MERN pour les projets fullstack.',
        },
      ],
    },
  ];

  for (const course of coursesData) {
    // Insert course
    await db.insert(courses).values({
      id: course.id,
      ownerId: course.ownerId,
    });

    // Insert course image
    await db.insert(courseImages).values({
      id: uuidv4(),
      altText: course.imageAltText,
      contentType: 'image/png',
      blob: course.imageContent,
      courseId: course.id,
    });

    // Insert translations
    for (const t of course.translations) {
      await db.insert(courseTranslations).values({
        id: uuidv4(),
        courseId: course.id,
        languageId: t.languageId,
        title: t.title,
        description: t.description,
      });
    }
  }

  console.log('✅ Seeding complete! Time to flex with Drizzle!');
}

seed().catch(console.error);
