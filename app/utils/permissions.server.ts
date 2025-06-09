import { json } from '@remix-run/node'
import { requireUserId } from './auth.server.ts'
import { type PermissionString, parsePermissionString } from './user.ts'
import { db } from './db.server.ts'
import {
	permissions,
	roleToPermission,
	roles,
	userToRole,
	users,
} from '../../drizzle/schema.ts'
import { and, eq, inArray } from 'drizzle-orm'

export async function requireUserWithPermission(
	request: Request,
	permission: PermissionString,
) {
	const userId = await requireUserId(request)
	const permissionData = parsePermissionString(permission)
	const permissionWhere = permissionData.access
		? [inArray(permissions.access, permissionData.access)]
		: []
	const [user] = await db
		.select({ id: users.id })
		.from(users)
		.innerJoin(userToRole, eq(users.id, userToRole.userId))
		.innerJoin(roles, eq(userToRole.roleId, roles.id))
		.innerJoin(roleToPermission, eq(roles.id, roleToPermission.roleId))
		.innerJoin(permissions, eq(roleToPermission.permissionId, permissions.id))
		.where(and(eq(users.id, userId), ...permissionWhere))
	if (!user) {
		throw json(
			{
				error: 'Unauthorized',
				requiredPermission: permissionData,
				message: `Unauthorized: required permissions: ${permission}`,
			},
			{ status: 403 },
		)
	}
	return user.id
}

export async function requireUserWithRole(request: Request, name: string) {
	const userId = await requireUserId(request)
	const [user] = await db
		.select({ id: users.id })
		.from(users)
		.innerJoin(userToRole, eq(users.id, userToRole.userId))
		.innerJoin(roles, eq(userToRole.roleId, roles.id))
		.where(and(eq(users.id, userId), eq(roles.name, name)))
	if (!user) {
		throw json(
			{
				error: 'Unauthorized',
				requiredRole: name,
				message: `Unauthorized: required role: ${name}`,
			},
			{ status: 403 },
		)
	}
	return user.id
}
