import fs from 'node:fs'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'
import { UniqueEnforcer } from 'enforce-unique'

const uniqueUsernameEnforcer = new UniqueEnforcer()

export function createUser() {
	const firstName = faker.person.firstName()
	const lastName = faker.person.lastName()

	const username = uniqueUsernameEnforcer
		.enforce(() => {
			return (
				faker.string.alphanumeric({ length: 2 }) +
				'_' +
				faker.internet.userName({
					firstName: firstName.toLowerCase(),
					lastName: lastName.toLowerCase(),
				})
			)
		})
		.slice(0, 20)
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, '_')
	return {
		username,
		name: `${firstName} ${lastName}`,
		email: `${username}@example.com`,
	}
}

export function createPassword(password: string = faker.internet.password()) {
	return {
		hash: bcrypt.hashSync(password, 10),
	}
}

let courseImages: Array<Awaited<ReturnType<typeof img>>> | undefined
export async function getCourseImages() {
	if (courseImages) return courseImages

	courseImages = await Promise.all([
		img({
			altText: 'a nice country house',
			filepath: './tests/fixtures/images/courses/0.png',
		}),
		img({
			altText: 'a city scape',
			filepath: './tests/fixtures/images/courses/1.png',
		}),
		img({
			altText: 'a sunrise',
			filepath: './tests/fixtures/images/courses/2.png',
		}),
		img({
			altText: 'a group of friends',
			filepath: './tests/fixtures/images/courses/3.png',
		}),
		img({
			altText: 'friends being inclusive of someone who looks lonely',
			filepath: './tests/fixtures/images/courses/4.png',
		}),
		img({
			altText: 'an illustration of a hot air balloon',
			filepath: './tests/fixtures/images/courses/5.png',
		}),
		img({
			altText:
				'an office full of laptops and other office equipment that look like it was abandoned in a rush out of the building in an emergency years ago.',
			filepath: './tests/fixtures/images/courses/6.png',
		}),
		img({
			altText: 'a rusty lock',
			filepath: './tests/fixtures/images/courses/7.png',
		}),
		img({
			altText: 'something very happy in nature',
			filepath: './tests/fixtures/images/courses/8.png',
		}),
		img({
			altText: `someone at the end of a cry session who's starting to feel a little better.`,
			filepath: './tests/fixtures/images/courses/9.png',
		}),
	])

	return courseImages
}

let userImages: Array<Awaited<ReturnType<typeof img>>> | undefined
export async function getUserImages() {
	if (userImages) return userImages

	userImages = await Promise.all(
		Array.from({ length: 10 }, (_, index) =>
			img({ filepath: `./tests/fixtures/images/user/${index}.jpg` }),
		),
	)

	return userImages
}

export async function img({
	altText,
	filepath,
}: {
	altText?: string
	filepath: string
}) {
	return {
		altText,
		contentType: filepath.endsWith('.png') ? 'image/png' : 'image/jpeg',
		blob: await fs.promises.readFile(filepath),
	}
}
