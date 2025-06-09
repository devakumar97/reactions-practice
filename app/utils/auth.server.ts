import { redirect } from '@remix-run/node'
import bcrypt from 'bcryptjs'
import { Authenticator } from 'remix-auth'
import { safeRedirect } from 'remix-utils/safe-redirect'
import { connectionSessionStorage, providers } from './connections.server.ts'
import {
	connections,
	passwords,
	roles,
	userToRole,
	sessions,
	users,
	userImages,
} from '../../drizzle/schema'
import { combineHeaders, downloadFile } from './misc.tsx'
import { type ProviderUser } from './providers/provider.ts'
import { authSessionStorage } from './session.server.ts'
import { gt, and, eq, sql, type InferSelectModel } from 'drizzle-orm'
import { db, first } from './db.server.ts'

export const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30
export const getSessionExpirationDate = () =>
	new Date(Date.now() + SESSION_EXPIRATION_TIME)

export const sessionKey = 'sessionId'

export const authenticator = new Authenticator<ProviderUser>(
	connectionSessionStorage,
)

for (const [providerName, provider] of Object.entries(providers)) {
	authenticator.use(provider.getAuthStrategy(), providerName)
}

export async function getUserId(request: Request) {
	const authSession = await authSessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const sessionId = authSession.get(sessionKey)
	if (!sessionId) return null
	const session = await db.query.sessions.findFirst({
		with: { user: { columns: { id: true } } },
		where: and(
			eq(sessions.id, sessionId),
			gt(sessions.expirationDate, new Date()),
		),
	})
	if (!session?.userId) {
		throw redirect('/', {
			headers: {
				'set-cookie': await authSessionStorage.destroySession(authSession),
			},
		})
	}
	return session.userId
}

export async function requireUserId(
	request: Request,
	{ redirectTo }: { redirectTo?: string | null } = {},
) {
	const userId = await getUserId(request)
	if (!userId) {
		const requestUrl = new URL(request.url)
		redirectTo =
			redirectTo === null
				? null
				: (redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`)
		const loginParams = redirectTo ? new URLSearchParams({ redirectTo }) : null
		const loginRedirect = ['/login', loginParams?.toString()]
			.filter(Boolean)
			.join('?')
		throw redirect(loginRedirect)
	}
	return userId
}

export async function requireAnonymous(request: Request) {
	const userId = await getUserId(request)
	if (userId) {
		throw redirect('/')
	}
}

export async function login({
	username,
	password,
}: {
	username: InferSelectModel<typeof users>['username']
	password: string
}) {
	const user = await verifyUserPassword({ username }, password)
	if (!user) return null
	const [session] = await db
		.insert(sessions)
		.values({
			expirationDate: getSessionExpirationDate(),
			userId: user.id,
		})
		.returning({
			id: sessions.id,
			expirationDate: sessions.expirationDate,
			userId: sessions.userId,
		})
	return session
}

export async function resetUserPassword({
	username,
	password,
}: {
	username: InferSelectModel<typeof users>['username']
	password: string
}) {
	const hashedPassword = await getPasswordHash(password)
	return db
		.update(passwords)
		.set({ hash: hashedPassword })
		.from(users)
		.where(and(eq(users.username, username), eq(users.id, passwords.userId)))}

export async function signup({
	email,
	username,
	password,
	name,
}: {
	email: InferSelectModel<typeof users>['email']
	username: InferSelectModel<typeof users>['username']
	name: InferSelectModel<typeof users>['name']
	password: string
}) {
	return await db.transaction(async (tx) => {
    // 1. Create the User
    const user = await tx
      .insert(users)
      .values({
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        name,
      })
      .returning()
      .then(first); // Get the inserted user row

    // 2. Store hashed password
    await tx.insert(passwords).values({
      hash: await getPasswordHash(password),
      userId: user.id,
    });

    // 3. Attach default "user" role
    await tx.insert(userToRole).select(
      tx
        .select({
          roleId: roles.id,
          userId: sql`${user.id}`.as('userId'), // Inline raw SQL injection of ID
        })
        .from(roles)
        .where(eq(roles.name, 'user'))
    );

    // 4. Create a session
    const session = await tx
      .insert(sessions)
      .values({
        expirationDate: getSessionExpirationDate(),
        userId: user.id,
      })
      .returning()
      .then(first);

    return session;
  });
}

export async function signupWithConnection({
	email,
	username,
	name,
	providerId,
	providerName,
	imageUrl,
}: {
	email: InferSelectModel<typeof users>['email']
	username: InferSelectModel<typeof users>['username']
	name: InferSelectModel<typeof users>['name']
	providerId: InferSelectModel<typeof connections>['providerId']
	providerName: InferSelectModel<typeof connections>['providerName']
	imageUrl?: string
}) {
	return await db.transaction(async (tx) => {
		const user = await tx
			.insert(users)
			.values({
				email: email.toLowerCase(),
				username: username.toLowerCase(),
				name,
			})
			.returning()
			.then(first)

		await tx.insert(userToRole).select(
			tx
				.select({
					roleId: roles.id,
					userId: sql`${user.id}`.as('userId'),
				})
				.from(roles)
				.where(eq(roles.name, 'user')),
		)

		await tx.insert(connections).values({
			providerId,
			providerName,
			userId: user.id,
		})

		if (imageUrl) {
			await tx.insert(userImages).values({
				...(await downloadFile(imageUrl)),
				userId: user.id,
			})
		}

		const session = await tx
			.insert(sessions)
			.values({
				expirationDate: getSessionExpirationDate(),
				userId: user.id,
			})
			.returning()
			.then(first)

		return session
	})
}

export async function logout(
	{
		request,
		redirectTo = '/',
	}: {
		request: Request
		redirectTo?: string
	},
	responseInit?: ResponseInit,
) {
	const authSession = await authSessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const sessionId = authSession.get(sessionKey)
	// if this fails, we still need to delete the session from the user's browser
	// and it doesn't do any harm staying in the db anyway.
	if (sessionId) {
		// the .catch is important because that's what triggers the query.
		// learn more about PrismaPromise: https://www.prisma.io/docs/orm/reference/prisma-client-reference#prismapromise-behavior
		void db
			.delete(sessions)
			.where(eq(sessions.id, sessionId))
			.catch(() => {})
	}
	throw redirect(safeRedirect(redirectTo), {
		...responseInit,
		headers: combineHeaders(
			{ 'set-cookie': await authSessionStorage.destroySession(authSession) },
			responseInit?.headers,
		),
	})
}

export async function getPasswordHash(password: string) {
	const hash = await bcrypt.hash(password, 10)
	return hash
}

export async function verifyUserPassword(
	where:
		| Pick<InferSelectModel<typeof users>, 'username'>
		| Pick<InferSelectModel<typeof users>, 'id'>,
	password: InferSelectModel<typeof passwords>['hash'],
) {
	const userWithPassword = await db.query.users.findFirst({
		where:
			'username' in where
				? eq(users.username, where.username)
				: eq(users.id, where.id),
		with: { password: { columns: { hash: true } } },
	})

	if (!userWithPassword || !userWithPassword.password) {
		return null
	}

	const isValid = await bcrypt.compare(password, userWithPassword.password.hash)

	if (!isValid) {
		return null
	}

	return { id: userWithPassword.id }
}
