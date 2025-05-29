import { faker } from '@faker-js/faker'
import { promiseHash } from 'remix-utils/promise'
import { prisma } from '#app/utils/db.server.ts'
import { MOCK_CODE_GITHUB } from '#app/utils/providers/constants'
import {
	createPassword,
	createUser,
	getNoteImages,
	getUserImages,
	img,
} from '#tests/db-utils.ts'
import { insertGitHubUser } from '#tests/mocks/github.ts'

async function seed() {
	console.log('🌱 Seeding...')
	console.time(`🌱 Database has been seeded`)

	const totalUsers = 5
	console.time(`👤 Created ${totalUsers} users...`)
	const noteImages = await getNoteImages()
	const userImages = await getUserImages()

	await prisma.role.createMany({
		data: [
		{ name: 'user' },
		{ name: 'admin' }
		],
		skipDuplicates: true 
	});
	
	const permissionList = [
  // User-level permissions
  { action: 'create', entity: 'note', access: 'own' },
  { action: 'read', entity: 'note', access: 'own' },
  { action: 'update', entity: 'note', access: 'own' },
  { action: 'delete', entity: 'note', access: 'own' },
  { action: 'read', entity: 'course', access: 'own' },

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

// Seed permissions
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

// Assign permissions to roles
const allPermissions = await prisma.permission.findMany()
const userPermissions = allPermissions.filter(p => p.access === 'own')
const adminPermissions = allPermissions

await prisma.role.update({
  where: { name: 'user' },
  data: {
    permissions: {
      connect: userPermissions.map(p => ({
        id: p.id,
      })),
    },
  },
})

await prisma.role.update({
  where: { name: 'admin' },
  data: {
    permissions: {
      connect: adminPermissions.map(p => ({
        id: p.id,
      })),
    },
  },
})

console.timeEnd('🔐 Created permissions and assigned to roles')

	for (let index = 0; index < totalUsers; index++) {
		const userData = createUser()
		await prisma.user
			.create({
				select: { id: true },
				data: {
					...userData,
					password: { create: createPassword(userData.username) },
					image: { create: userImages[index % userImages.length] },
					roles: { connect: { name: 'user' } },
					notes: {
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
			})
			.catch((e) => {
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
			filepath: './tests/fixtures/images/deva-notes/cute-koala.png',
		}),
		koalaEating: img({
			altText: 'a cartoon illustration of a koala in a tree eating',
			filepath: './tests/fixtures/images/deva-notes/koala-eating.png',
		}),
		koalaCuddle: img({
			altText: 'a cartoon illustration of koalas cuddling',
			filepath: './tests/fixtures/images/deva-notes/koala-cuddle.png',
		}),
		mountain: img({
			altText: 'a beautiful mountain covered in snow',
			filepath: './tests/fixtures/images/deva-notes/mountain.png',
		}),
		koalaCoder: img({
			altText: 'a koala coding at the computer',
			filepath: './tests/fixtures/images/deva-notes/koala-coder.png',
		}),
		koalaMentor: img({
			altText:
				'a koala in a friendly and helpful posture. The Koala is standing next to and teaching a woman who is coding on a computer and shows positive signs of learning and understanding what is being explained.',
			filepath: './tests/fixtures/images/deva-notes/koala-mentor.png',
		}),
		koalaSoccer: img({
			altText: 'a cute cartoon koala kicking a soccer ball on a soccer field ',
			filepath: './tests/fixtures/images/deva-notes/koala-soccer.png',
		}),
	})

	const githubUser = await insertGitHubUser(MOCK_CODE_GITHUB)

	await prisma.user.create({
		select: { id: true },
		data: {
			email: 'deva@adp.dev',
			username: 'deva',
			name: 'Deva',
			image: { create: devaImages.devaUser },
			password: { create: createPassword('devalovesyou') },
			connections: {
				create: { providerName: 'github', providerId: githubUser.profile.id },
			},
			roles: { connect: [{ name: 'admin' }, { name: 'user' }] },
			notes: {
				create: [
					{
						id: 'd27a197e',
						title: 'Basic Koala Facts',
						content:
							'Koalas are found in the eucalyptus forests of eastern Australia. They have grey fur with a cream-coloured chest, and strong, clawed feet, perfect for living in the branches of trees!',
						images: { create: [devaImages.cuteKoala, devaImages.koalaEating] },
					},
					{
						id: '414f0c09',
						title: 'Koalas like to cuddle',
						content:
							'Cuddly critters, koalas measure about 60cm to 85cm long, and weigh about 14kg.',
						images: {
							create: [devaImages.koalaCuddle],
						},
					},
					{
						id: '260366b1',
						title: 'Not bears',
						content:
							"Although you may have heard people call them koala 'bears', these awesome animals aren’t bears at all – they are in fact marsupials. A group of mammals, most marsupials have pouches where their newborns develop.",
					},
					{
						id: 'bb79cf45',
						title: 'Snowboarding Adventure',
						content:
							"Today was an epic day on the slopes! Shredded fresh powder with my friends, caught some sick air, and even attempted a backflip. Can't wait for the next snowy adventure!",
						images: {
							create: [devaImages.mountain],
						},
					},
					{
						id: '9f4308be',
						title: 'Onewheel Tricks',
						content:
							"Mastered a new trick on my Onewheel today called '180 Spin'. It's exhilarating to carve through the streets while pulling off these rad moves. Time to level up and learn more!",
					},
					{
						id: '306021fb',
						title: 'Coding Dilemma',
						content:
							"Stuck on a bug in my latest coding project. Need to figure out why my function isn't returning the expected output. Time to dig deep, debug, and conquer this challenge!",
						images: {
							create: [devaImages.koalaCoder],
						},
					},
					{
						id: '16d4912a',
						title: 'Coding Mentorship',
						content:
							"Had a fantastic coding mentoring session today with Sarah. Helped her understand the concept of recursion, and she made great progress. It's incredibly fulfilling to help others improve their coding skills.",
						images: {
							create: [devaImages.koalaMentor],
						},
					},
					{
						id: '3199199e',
						title: 'Koala Fun Facts',
						content:
							"Did you know that koalas sleep for up to 20 hours a day? It's because their diet of eucalyptus leaves doesn't provide much energy. But when I'm awake, I enjoy munching on leaves, chilling in trees, and being the cuddliest koala around!",
					},
					{
						id: '2030ffd3',
						title: 'Skiing Adventure',
						content:
							'Spent the day hitting the slopes on my skis. The fresh powder made for some incredible runs and breathtaking views. Skiing down the mountain at top speed is an adrenaline rush like no other!',
						images: {
							create: [devaImages.mountain],
						},
					},
					{
						id: 'f375a804',
						title: 'Code Jam Success',
						content:
							'Participated in a coding competition today and secured the first place! The adrenaline, the challenging problems, and the satisfaction of finding optimal solutions—it was an amazing experience. Feeling proud and motivated to keep pushing my coding skills further!',
						images: {
							create: [devaImages.koalaCoder],
						},
					},
					{
						id: '562c541b',
						title: 'Koala Conservation Efforts',
						content:
							"Joined a local conservation group to protect koalas and their habitats. Together, we're planting more eucalyptus trees, raising awareness about their endangered status, and working towards a sustainable future for these adorable creatures. Every small step counts!",
					},
					// extra long note to test scrolling
					{
						id: 'f67ca40b',
						title: 'Game day',
						content:
							"Just got back from the most amazing game. I've been playing soccer for a long time, but I've not once scored a goal. Well, today all that changed! I finally scored my first ever goal.\n\nI'm in an indoor league, and my team's not the best, but we're pretty good and I have fun, that's all that really matters. Anyway, I found myself at the other end of the field with the ball. It was just me and the goalie. I normally just kick the ball and hope it goes in, but the ball was already rolling toward the goal. The goalie was about to get the ball, so I had to charge. I managed to get possession of the ball just before the goalie got it. I brought it around the goalie and had a perfect shot. I screamed so loud in excitement. After all these years playing, I finally scored a goal!\n\nI know it's not a lot for most folks, but it meant a lot to me. We did end up winning the game by one. It makes me feel great that I had a part to play in that.\n\nIn this team, I'm the captain. I'm constantly cheering my team on. Even after getting injured, I continued to come and watch from the side-lines. I enjoy yelling (encouragingly) at my team mates and helping them be the best they can. I'm definitely not the best player by a long stretch. But I really enjoy the game. It's a great way to get exercise and have good social interactions once a week.\n\nThat said, it can be hard to keep people coming and paying dues and stuff. If people don't show up it can be really hard to find subs. I have a list of people I can text, but sometimes I can't find anyone.\n\nBut yeah, today was awesome. I felt like more than just a player that gets in the way of the opposition, but an actual asset to the team. Really great feeling.\n\nAnyway, I'm rambling at this point and really this is just so we can have a note that's pretty long to test things out. I think it's long enough now... Cheers!",
						images: {
							create: [devaImages.koalaSoccer],
						},
					},
				],
			},
			courses: {
        create: [{
          title: 'Intro to Eucalyptus Studies',
          description: 'Understand the biology and ecology of eucalyptus trees.',
          level: 'BEGINNER',
          duration: 90,
          language: 'English',
          images: {
            create: [{
              objectKey: 'course-intro-koala',
              altText: 'eucalyptus course image',
            }]
          }
        }]
      }
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