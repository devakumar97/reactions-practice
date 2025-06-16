import { type SerializeFrom } from '@remix-run/node'
import { useRouteLoaderData } from '@remix-run/react'
import { type loader as rootLoader } from '#app/root.tsx'

function isUser(user: any): user is SerializeFrom<typeof rootLoader>['user'] {
	return user && typeof user === 'object' && typeof user.id === 'string'
}

export function useOptionalUser() {
	const data = useRouteLoaderData<typeof rootLoader>('root')
	if (!data || !isUser(data.user)) {
		return undefined
	}
	return data.user
}

export function useUser() {
	const maybeUser = useOptionalUser()
	if (!maybeUser) {
		throw new Error(
			'No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead.',
		)
	}
	return maybeUser
}

type Action = 'create' | 'read' | 'update' | 'delete'
type Entity = 'user' | 'note' | 'course'
type Access = 'own' | 'any' | 'own,any' | 'any,own'
export type PermissionString =
	| `${Action}:${Entity}`
	| `${Action}:${Entity}:${Access}`

export function parsePermissionString(permissionString: PermissionString) {
	const [action, entity, access] = permissionString.split(':') as [
		Action,
		Entity,
		Access | undefined,
	]
	return {
		action,
		entity,
		access: access ? (access.split(',') as Array<Access>) : undefined,
	}
}

export function userHasPermission(
	user: Pick<ReturnType<typeof useUser>, 'roles'> | null | undefined,
	permission: PermissionString,
) {
	if (!user) return false
  const { action, entity, access } = parsePermissionString(permission)
//   console.log('Checking permission:', permission)
//   console.log('Parsed:', { action, entity, access })
  return user.roles.some(role => {
    // console.log('Role:', role.name)
    return role.permissions.some(p => {
    //   console.log('Permission:', p)
      const match =
        p.entity === entity &&
        p.action === action &&
        (!access || access.includes(p.access))
    //   console.log('Match:', match)
      return match
    })
  })
}

export function userHasRole(
	user: Pick<ReturnType<typeof useUser>, 'roles'> | null,
	role: string,
) {
	if (!user) return false
	return user.roles.some((r) => r.name === role)
}
