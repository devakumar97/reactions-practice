import { faker } from '@faker-js/faker'
import { promiseHash } from 'remix-utils/promise'
import { prisma } from '#app/utils/db.server.ts'
import { MOCK_CODE_GITHUB } from '#app/utils/providers/constants'
import {
	createPassword,
	createUser,
	getCourseImages,
	getUserImages,
	img,
} from '#tests/db-utils.ts'
import { insertGitHubUser } from '#tests/mocks/github.ts'

async function seed() {
	console.log('🌱 Seeding...')
	console.time(`🌱 Database has been seeded`)

	const totalUsers = 5
	console.time(`👤 Created ${totalUsers} users...`)
	const courseImages = await getCourseImages()
	const userImages = await getUserImages()

	await prisma.role.createMany({
		data: [
			{ name: 'user' },
			{ name: 'admin' }
		],
		skipDuplicates: true
	})

	const permissionList = [
		// User-level permissions
		{ action: 'create', entity: 'note', access: 'own' },
		{ action: 'read', entity: 'note', access: 'own' },
		{ action: 'update', entity: 'note', access: 'own' },
		{ action: 'delete', entity: 'note', access: 'own' },
		{ action: 'create', entity: 'course', access: 'own' },
		{ action: 'read', entity: 'course', access: 'own' },
		{ action: 'update', entity: 'course', access: 'own' },
		{ action: 'delete', entity: 'course', access: 'own' },

		// Admin-level permissions
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

	console.time('🔐 Created permissions and assigned to roles')

	await Promise.all(
		permissionList.map(p =>
			prisma.permission.upsert({
				where: {
					action_entity_access: {
						action: p.action,
						entity: p.entity,
						access: p.access,
					},
				},
				update: {},
				create: p,
			})
		)
	)

	const allPermissions = await prisma.permission.findMany()
	const userPermissions = allPermissions.filter(p => p.access === 'own')
	const adminPermissions = allPermissions

	await prisma.role.update({
		where: { name: 'user' },
		data: {
			permissions: {
				connect: userPermissions.map(p => ({ id: p.id })),
			},
		},
	})

	await prisma.role.update({
		where: { name: 'admin' },
		data: {
			permissions: {
				connect: adminPermissions.map(p => ({ id: p.id })),
			},
		},
	})

	console.timeEnd('🔐 Created permissions and assigned to roles')

	for (let index = 0; index < totalUsers; index++) {
		const userData = createUser()
		await prisma.user.create({
			select: { id: true },
			data: {
				...userData,
				password: { create: createPassword(userData.username) },
				image: { create: userImages[index % userImages.length] },
				roles: { connect: { name: 'user' } },
				courses: {
					create: Array.from({
						length: faker.number.int({ min: 1, max: 3 }),
					}).map(() => ({
						title: faker.lorem.sentence(),
						content: faker.lorem.paragraphs(),
						images: {
							create: Array.from({
								length: faker.number.int({ min: 1, max: 3 }),
							}).map(() => {
								const imgNumber = faker.number.int({ min: 0, max: 9 })
								const img = noteImages[imgNumber]
								if (!img) {
									throw new Error(`Could not find image #${imgNumber}`)
								}
								return img
							}),
						},
					})),
				},
			},
		}).catch(e => {
			console.error('Error creating a user:', e)
			return null
		})
	}
	console.timeEnd(`👤 Created ${totalUsers} users...`)

	console.time(`🐨 Created admin user "deva"`)

	const devaImages = await promiseHash({
		devaUser: img({ filepath: './tests/fixtures/images/user/deva.png' }),
		cuteKoala: img({
			altText: 'an adorable koala cartoon illustration',
			filepath: './tests/fixtures/images/deva-courses/cute-koala.png',
		}),
		koalaEating: img({
			altText: 'a cartoon illustration of a koala in a tree eating',
			filepath: './tests/fixtures/images/deva-courses/koala-eating.png',
		}),
		koalaCuddle: img({
			altText: 'a cartoon illustration of koalas cuddling',
			filepath: './tests/fixtures/images/deva-courses/koala-cuddle.png',
		}),
		mountain: img({
			altText: 'a beautiful mountain covered in snow',
			filepath: './tests/fixtures/images/deva-courses/mountain.png',
		}),
		koalaCoder: img({
			altText: 'a koala coding at the computer',
			filepath: './tests/fixtures/images/deva-courses/koala-coder.png',
		}),
		koalaMentor: img({
			altText:
				'a koala in a friendly and helpful posture. The Koala is standing next to and teaching a woman who is coding on a computer and shows positive signs of learning and understanding what is being explained.',
			filepath: './tests/fixtures/images/deva-courses/koala-mentor.png',
		}),
		koalaSoccer: img({
			altText: 'a cute cartoon koala kicking a soccer ball on a soccer field ',
			filepath: './tests/fixtures/images/deva-courses/koala-soccer.png',
		}),
	})

	const githubUser = await insertGitHubUser(MOCK_CODE_GITHUB)

	await prisma.user.create({
		select: { id: true },
		data: {
			email: 'deva@adpt.dev',
			username: 'deva',
			name: 'Deva',
			image: { create: devaImages.devaUser },
			password: { create: createPassword('devtodev') },
			connections: {
				create: { providerName: 'github', providerId: githubUser.profile.id },
			},
			roles: { connect: [{ name: 'admin' }, { name: 'user' }] },
			courses: {
				create: [
					{
						duration: 90,
						translation: {
							create: [
								{
									title: 'Intro to Eucalyptus Studies',
									description: 'Eucalyptus studies',
									content: 'Understand the biology and ecology of eucalyptus trees.',
									level: 'BEGINNER',
									language: {
										connectOrCreate: {
											where: { id: 'en' },
											create: { id: 'en', name: 'English' },
										},
									},
								},
								{
									title: 'Introducción a los Estudios del Eucalipto',
									description: 'Estudios sobre el eucalipto',
									content: 'Comprender la biología y la ecología de los árboles de eucalipto.',
									level: 'BEGINNER',
									language: {
										connectOrCreate: {
											where: { id: 'es' },
											create: { id: 'es', name: 'Español' },
										},
									},
								},
								{
									title: 'Introduction aux Études sur l’Eucalyptus',
									description: 'Études sur l’eucalyptus',
									content: 'Comprendre la biologie et l’écologie des arbres d’eucalyptus.',
									level: 'BEGINNER',
									language: {
										connectOrCreate: {
											where: { id: 'fr' },
											create: { id: 'fr', name: 'Français' },
										},
									},
								},
							],
						},
						images: {
							create: [
								{
									contentType: 'image/png',
									altText: 'Eucalyptus course image',
									blob: Buffer.from('fake-image-content-for-course-1'),
								},
							],
						},
					},
					{
						duration: 120,
						translation: {
							create: [
								{
									title: 'Advanced Koala Behavior',
									description: 'Deep dive into koala habits and ecology',
									content: 'Explore complex koala social behavior and habitat.',
									level: 'ADVANCED',
									language: {
										connectOrCreate: {
											where: { id: 'en' },
											create: { id: 'en', name: 'English' },
										},
									},
								},
								{
									title: 'Comportamiento avanzado de koalas',
									description: 'Estudio profundo de los hábitos y ecología de los koalas',
									content: 'Explora el comportamiento social complejo y el hábitat de los koalas.',
									level: 'ADVANCED',
									language: {
										connectOrCreate: {
											where: { id: 'es' },
											create: { id: 'es', name: 'Español' },
										},
									},
								},
							],
						},
						images: {
							create: [
								{
									contentType: 'image/png',
									altText: 'Koala behavior course image',
									blob: Buffer.from('fake-image-content-for-course-2'),
								},
							],
						},
					},
				],
			},
		},
	})

	console.timeEnd(`🐨 Created admin user "deva"`)

	console.timeEnd(`🌱 Database has been seeded`)
}

seed()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
