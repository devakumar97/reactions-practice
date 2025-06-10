// This is a Drizzle-based rewrite of the Prisma seed script
// Requires your drizzle drizzle client set up (usually `import { drizzle } from '@/drizzle'` or similar)
import { eq } from 'drizzle-orm'
import { drizzle } from '#app/utils/db.server'
import { faker } from '@faker-js/faker'
import { createId } from '@paralleldrive/cuid2'
import {
  Course,
  CourseImage,
  CourseTranslation,
  Language,
  Password,
  Permission,
  Role,
  User,
  UserImage,
  Connection,
  } from './schema.ts'
import {
  createPassword,
  createUser,
  getUserImages,
  img,
} from '#tests/db-utils.ts'
import { insertGitHubUser } from '#tests/mocks/github.ts'
import { MOCK_CODE_GITHUB } from '#app/utils/providers/constants'

async function seed() {
  console.log('🌱 Seeding...')
  const totalUsers = 5
  const userImages = await getUserImages()

  const now = new Date()

  const userRoleId = createId()
  const adminRoleId = createId()

  // Roles
  await drizzle.insert(Role).values([
    { id: userRoleId, name: 'user', createdAt: now, updatedAt: now },
    { id: adminRoleId, name: 'admin', createdAt: now, updatedAt: now },
  ])

  const permissionList = [
    // User permissions
    { action: 'create', entity: 'note', access: 'own' },
    { action: 'read', entity: 'note', access: 'own' },
    { action: 'update', entity: 'note', access: 'own' },
    { action: 'delete', entity: 'note', access: 'own' },
    { action: 'create', entity: 'course', access: 'own' },
    { action: 'read', entity: 'course', access: 'own' },
    { action: 'update', entity: 'course', access: 'own' },
    { action: 'delete', entity: 'course', access: 'own' },
    // Admin permissions
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
  ]

  const permissionValues = permissionList.map(p => ({
    id: createId(),
    ...p,
    description: '',
    createdAt: now,
    updatedAt: now,
  }))

  await drizzle.insert(Permission).values(permissionValues)

  const userPermissions = permissionValues.filter(p => p.access === 'own')
  const adminPermissions = permissionValues

  // create basic users
  for (let i = 0; i < totalUsers; i++) {
    const userData = createUser()
    const userId = createId()

    await drizzle.insert(User).values({
      id: userId,
      email: userData.email,
      username: userData.username,
      name: userData.name,
      createdAt: now,
      updatedAt: now,
    })

    await drizzle.insert(UserImage).values({
      ...userImages[i % userImages.length],
      userId,
      id: createId(),
      createdAt: now,
      updatedAt: now,
    })

    await drizzle.insert(Password).values({
      userId,
      hash: createPassword(userData.username),
    })

    // Skip notes in this drizzle version (can be added if schema is provided)
  }

  // create admin user (Deva)
  const devaId = createId()
  const githubUser = await insertGitHubUser(MOCK_CODE_GITHUB)
  const devaImages = await Promise.all([
    img({ filepath: './tests/fixtures/images/user/deva.png' }),
  ])

  await drizzle.insert(User).values({
    id: devaId,
    email: 'deva@adpt.dev',
    username: 'deva',
    name: 'Deva',
    createdAt: now,
    updatedAt: now,
  })

  await drizzle.insert(UserImage).values({
    ...devaImages[0],
    userId: devaId,
    id: createId(),
    createdAt: now,
    updatedAt: now,
  })

  await drizzle.insert(Password).values({
    userId: devaId,
    hash: createPassword('devtodev'),
  })

  await drizzle.insert(Connection).values({
    id: createId(),
    userId: devaId,
    providerId: githubUser.profile.id,
    providerName: 'github',
    createdAt: now,
    updatedAt: now,
  })

  // Add languages
  await drizzle.insert(Language).values([
    { id: 'en', name: 'English' },
    { id: 'es', name: 'Español' },
    { id: 'fr', name: 'Français' },
  ])

  // Create a sample course with translations
  const courseId = createId()
  await drizzle.insert(Course).values({
    id: courseId,
    duration: 90,
    ownerId: devaId,
    createdAt: now,
    updatedAt: now,
  })

  await drizzle.insert(CourseTranslation).values([
    {
      courseId,
      languageId: 'en',
      title: 'Intro to Eucalyptus Studies',
      description: 'Eucalyptus studies',
      content: 'Understand the biology and ecology of eucalyptus trees.',
      level: 'BEGINNER',
    },
    {
      courseId,
      languageId: 'es',
      title: 'Introducción a los Estudios del Eucalipto',
      description: 'Estudios sobre el eucalipto',
      content: 'Comprender la biología y la ecología de los árboles de eucalipto.',
      level: 'BEGINNER',
    },
    {
      courseId,
      languageId: 'fr',
      title: 'Introduction aux Études sur l’Eucalyptus',
      description: 'Études sur l’eucalyptus',
      content: 'Comprendre la biologie et l’écologie des arbres d’eucalyptus.',
      level: 'BEGINNER',
    },
  ])

  await drizzle.insert(CourseImage).values({
    id: createId(),
    courseId,
    altText: 'Eucalyptus course image',
    contentType: 'image/png',
    blob: Buffer.from('fake-image-content-for-course-1'),
    createdAt: now,
    updatedAt: now,
  })

  console.log('✅ Seed complete')
}

seed().catch(e => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})  