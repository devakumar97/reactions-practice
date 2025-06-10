import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import {
  text,
  integer,
  pgTable,
  primaryKey,
  index,
  uniqueIndex,
  timestamp,
  pgEnum,
  } from 'drizzle-orm/pg-core'
  import { customType } from 'drizzle-orm/pg-core';

// Custom type for bytea
const bytea = customType<{ data: string }>({
  dataType() {
    return 'bytea';
  },
});

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
}

// Enum for course level
export const courseLevelEnum = pgEnum('course_level', ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

export const User = pgTable('User', {
	id: text()
		.primaryKey()
		.$defaultFn(() => createId()),
	email: text().notNull().unique('User_email_key'),
	username: text().notNull().unique('User_username_key'),
	name: text(),
	...timestamps,
})

export const Course = pgTable(
	'Course',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => createId()),
		duration: integer('duration').notNull(),
		...timestamps,
		ownerId: text()
			.notNull()
			.references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	},
	(table) => ({
		ownerIdUpdatedAtIdx: index('Course_ownerId_updatedAt_idx').on(
			table.ownerId,
			table.updatedAt,
		),
		ownerIdIdx: index('Course_ownerId_idx').on(table.ownerId),
	}),
)

export const CourseImage = pgTable(
	'CourseImage',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => createId()),
		altText: text(),
		contentType: text().notNull(),
		blob: bytea().notNull(),
		...timestamps,
		courseId: text()
			.notNull()
			.references(() => Course.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	},
	(table) => ({
		courseIdIdx: index('CourseImage_courseId_idx').on(table.courseId),
	}),
)

export const UserImage = pgTable('UserImage', {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId()),
  altText: text(),
  contentType: text().notNull(),
  blob: bytea().notNull(),
  ...timestamps,
  userId: text()
    .notNull()
    .unique('UserImage_userId_key')
    .references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
})

export const Language = pgTable('Language', {
  id: text().primaryKey(),
  name: text().notNull(),
});

export const CourseTranslation = pgTable('CourseTranslation', {
  courseId: text().notNull().references(() => Course.id, { onDelete: 'cascade' }),
  languageId: text().notNull().references(() => Language.id, { onDelete: 'cascade' }),
  title: text().notNull(),
  description: text().notNull(),
  content: text().notNull(),
  level: courseLevelEnum().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.courseId, table.languageId] }),
}));

export const Password = pgTable('Password', {
	hash: text().notNull(),
	userId: text()
		.notNull()
		.unique('Password_userId_key')
		.references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
})

export const Session = pgTable(
	'Session',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => createId()),
		expirationDate: timestamp({ withTimezone: true }).notNull(),
		...timestamps,
		userId: text()
			.notNull()
			.references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	},
	(table) => ({
		userIdIdx: index('Session_userId_idx').on(table.userId),
	}),
)

export const Permission = pgTable(
	'Permission',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => createId()),
		action: text().notNull(),
		entity: text().notNull(),
		access: text().notNull(),
		description: text().default('').notNull(),
		...timestamps,
	},
	(table) => ({
		actionEntityAccessKey: uniqueIndex(
			'Permission_action_entity_access_key',
		).on(table.action, table.entity, table.access),
	}),
)

export const Role = pgTable('Role', {
	id: text()
		.primaryKey()
		.$defaultFn(() => createId()),
	name: text().notNull().unique('Role_name_key'),
	description: text().default('').notNull(),
	...timestamps,
})

export const Verification = pgTable(
	'Verification',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => createId()),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		type: text().notNull(),
		target: text().notNull(),
		secret: text().notNull(),
		algorithm: text().notNull(),
		digits: integer().notNull(),
		period: integer().notNull(),
		charSet: text().notNull(),
		expiresAt: timestamp({ withTimezone: true }),
	},
	(table) => ({
		targetTypeKey: uniqueIndex('Verification_target_type_key').on(
			table.target,
			table.type,
		),
	}),
)

export const Connection = pgTable(
	'Connection',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => createId()),
		providerName: text().notNull(),
		providerId: text().notNull(),
		...timestamps,
		userId: text()
			.notNull()
			.references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	},
	(table) => ({
		providerNameProviderIdKey: uniqueIndex(
			'Connection_providerName_providerId_key',
		).on(table.providerName, table.providerId),
	}),
)

export const PermissionToRole = pgTable(
	'_PermissionToRole',
	{
		permissionId: text()
			.notNull()
			.references(() => Permission.id, {
				onDelete: 'cascade',
				onUpdate: 'cascade',
			}),
		roleId: text()
			.notNull()
			.references(() => Role.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	},
	(table) => ({
		roleIdIdx: index('PermissionToRole_roleId_idx').on(table.roleId),
		pk: primaryKey({ columns: [table.permissionId, table.roleId] }),
	}),
)

export const RoleToUser = pgTable(
	'_RoleToUser',
	{
		roleId: text()
			.notNull()
			.references(() => Role.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
		userId: text()
			.notNull()
			.references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	},
	(table) => ({
		userIdIdx: index('RoleToUser_userId_idx').on(table.userId),
		pk: primaryKey({ columns: [table.userId, table.roleId] }),
	}),
)

// Relations
export const courseRelations = relations(Course, ({ one, many }) => ({
	owner: one(User, {
		fields: [Course.ownerId],
		references: [User.id],
	}),
	images: many(CourseImage),
	translations: many(CourseTranslation),
}))

export const userRelations = relations(User, ({ one, many }) => ({
	courses: many(Course),
	image: one(UserImage),
	password: one(Password),
	sessions: many(Session),
	connections: many(Connection),
	roles: many(RoleToUser),
}))

export const courseImageRelations = relations(CourseImage, ({ one }) => ({
	course: one(Course, {
		fields: [CourseImage.courseId],
		references: [Course.id],
	}),
}))

export const userImageRelations = relations(UserImage, ({ one }) => ({
	user: one(User, {
		fields: [UserImage.userId],
		references: [User.id],
	}),
}))

export const passwordRelations = relations(Password, ({ one }) => ({
	user: one(User, {
		fields: [Password.userId],
		references: [User.id],
	}),
}))

export const sessionRelations = relations(Session, ({ one }) => ({
	user: one(User, {
		fields: [Session.userId],
		references: [User.id],
	}),
}))

export const connectionRelations = relations(Connection, ({ one }) => ({
	user: one(User, {
		fields: [Connection.userId],
		references: [User.id],
	}),
}))

export const permissionToRoleRelations = relations(
	PermissionToRole,
	({ one }) => ({
		role: one(Role, {
			fields: [PermissionToRole.roleId],
			references: [Role.id],
		}),
		permission: one(Permission, {
			fields: [PermissionToRole.permissionId],
			references: [Permission.id],
		}),
	}),
)

export const roleRelations = relations(Role, ({ many }) => ({
	permissionToRoles: many(PermissionToRole),
	roleToUsers: many(RoleToUser),
}))

export const permissionRelations = relations(Permission, ({ many }) => ({
	permissionToRoles: many(PermissionToRole),
}))

export const roleToUserRelations = relations(RoleToUser, ({ one }) => ({
	user: one(User, {
		fields: [RoleToUser.userId],
		references: [User.id],
	}),
	role: one(Role, {
		fields: [RoleToUser.roleId],
		references: [Role.id],
	}),
}))

export const courseTranslationRelations = relations(CourseTranslation, ({ one }) => ({
  course: one(Course, {
    fields: [CourseTranslation.courseId],
    references: [Course.id],
  }),
  language: one(Language, {
    fields: [CourseTranslation.languageId],
    references: [Language.id],
  }),
}))

export const languageRelations = relations(Language, ({ many }) => ({
  translations: many(CourseTranslation),
}))
