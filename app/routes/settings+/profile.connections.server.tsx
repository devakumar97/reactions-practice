import { drizzle } from "#app/utils/db.server.ts"
import { count, eq } from "drizzle-orm"
import { Connection, Password } from "../../../drizzle/schema"

export async function userCanDeleteConnections(userId: string): Promise<boolean> {
	// Step 1: check if user has password
	const hasPassword = await drizzle.query.Password.findFirst({
		where: eq(Password.userId, userId),
		columns: { userId: true },
	})

	if (hasPassword) return true

	// Step 2: count the number of connections
	const connectionCountResult = await drizzle
		.select({ count: count() })
		.from(Connection)
		.where(eq(Connection.userId, userId))

	const connectionCount = connectionCountResult[0]?.count ?? 0

	// Allow deletion if more than 1 connection exists
	return connectionCount > 1
}