import { invariant } from '@epic-web/invariant'
import { remember } from '@epic-web/remember'
import { config } from 'dotenv'
import { Client } from 'pg'
import { drizzle as DrizzleClient } from 'drizzle-orm/node-postgres'
import { type Logger } from 'drizzle-orm'
import chalk from 'chalk'
import * as schema from '../../drizzle/schema'

config()

class DrizzleLogger implements Logger {
  logQuery(query: string, params: unknown[]) {
    const formatted = query.replace(/\$(\d+)/g, (_, i) => JSON.stringify(params[+i - 1]))
    console.log(chalk.blueBright('SQL →'), formatted)
  }
}

export const db = remember('drizzle', () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  client.connect() // Important: connect manually before passing to drizzle

  const drizzle = DrizzleClient(client, {
    schema,
    logger: new DrizzleLogger(),
  })

  return drizzle
})

export function first<T>(results: T[]): T {
  invariant(results[0], 'Expected at least one result')
  return results[0]
}
