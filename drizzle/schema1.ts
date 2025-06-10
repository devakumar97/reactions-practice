// drizzle-schema.ts
import { pgTable, pgEnum, uuid, text, varchar, integer, timestamp, unique, index, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customType } from 'drizzle-orm/pg-core';

// Custom type for bytea
const binary = customType<{ data: string }>({
  dataType() {
    return 'bytea';
  },
});

// Enum for course level
export const courseLevelEnum = pgEnum('course_level', ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

// Tables
export const users = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

export const userImages = pgTable('user_image', {
  id: uuid('id').primaryKey().defaultRandom(),
  altText: text('alt_text'),
  contentType: varchar('content_type', { length: 255 }).notNull(),
  blob: binary('blob').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
  userId: uuid('user_id').unique().notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
});

export const courses = pgTable('course', {
  id: uuid('id').primaryKey().defaultRandom(),
  duration: integer('duration').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
}, (table) => ({
  ownerIdx: index('course_owner_id_idx').on(table.ownerId),
  ownerUpdatedAtIdx: index('course_owner_id_updated_at_idx').on(table.ownerId, table.updatedAt),
}));

export const courseImages = pgTable('course_image', {
  id: uuid('id').primaryKey().defaultRandom(),
  altText: text('alt_text'),
  contentType: varchar('content_type', { length: 255 }).notNull(),
  blob: binary('blob').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
}, (table) => ({
  courseIdx: index('course_image_course_id_idx').on(table.courseId),
}));

export const languages = pgTable('language', {
  id: varchar('id', { length: 10 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const courseTranslations = pgTable('course_translation', {
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  languageId: varchar('language_id', { length: 10 }).notNull().references(() => languages.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  content: text('content').notNull(),
  level: courseLevelEnum('level').default('BEGINNER'),
}, (table) => ({
  pk: primaryKey({ columns: [table.courseId, table.languageId] }),
}));

export const passwords = pgTable('password', {
  hash: text('hash').notNull(),
  userId: uuid('user_id').unique().notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
});

export const sessions = pgTable('session', {
  id: uuid('id').primaryKey().defaultRandom(),
  expirationDate: timestamp('expiration_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
}, (table) => ({
  userIdx: index('session_user_id_idx').on(table.userId),
}));

export const permissions = pgTable('permission', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: varchar('action', { length: 255 }).notNull(),
  entity: varchar('entity', { length: 255 }).notNull(),
  access: varchar('access', { length: 255 }).notNull(),
  description: text('description').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  uniqueActionEntityAccess: unique('permission_action_entity_access').on(table.action, table.entity, table.access),
}));

export const roles = pgTable('role', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).unique().notNull(),
  description: text('description').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

export const verifications = pgTable('verification', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  target: varchar('target', { length: 255 }).notNull(),
  secret: text('secret').notNull(),
  algorithm: varchar('algorithm', { length: 255 }).notNull(),
  digits: integer('digits').notNull(),
  period: integer('period').notNull(),
  charSet: varchar('char_set', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at'),
}, (table) => ({
  uniqueTargetType: unique('verification_target_type').on(table.target, table.type),
}));

export const connections = pgTable('connection', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerName: varchar('provider_name', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
}, (table) => ({
  uniqueProviderNameId: unique('connection_provider_name_id').on(table.providerName, table.providerId),
}));

export const userToRole = pgTable('user_to_role', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
}));

export const roleToPermission = pgTable('role_to_permission', {
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

// --- Relations (safe access pattern) ---
export const userRelations = relations(users, ({ one, many }) => ({
  image: one(userImages, { fields: [users.id], references: [userImages.userId] }),
  password: one(passwords, { fields: [users.id], references: [passwords.userId] }),
  roles: many(userToRole),
  sessions: many(sessions),
  connections: many(connections),
  courses: many(courses),
}));

export const userImageRelations = relations(userImages, ({ one }) => ({
  user: one(users, { fields: [userImages.userId], references: [users.id] }),
}));

export const courseRelations = relations(courses, ({ one, many }) => ({
  owner: one(users, { fields: [courses.ownerId], references: [users.id] }),
  images: many(courseImages),
  translations: many(courseTranslations),
}));

export const courseImageRelations = relations(courseImages, ({ one }) => ({
  course: one(courses, { fields: [courseImages.courseId], references: [courses.id] }),
}));

export const courseTranslationRelations = relations(courseTranslations, ({ one }) => ({
  course: one(courses, { fields: [courseTranslations.courseId], references: [courses.id] }),
  language: one(languages, { fields: [courseTranslations.languageId], references: [languages.id] }),
}));

export const languageRelations = relations(languages, ({ many }) => ({
  translations: many(courseTranslations),
}));

export const passwordRelations = relations(passwords, ({ one }) => ({
  user: one(users, { fields: [passwords.userId], references: [users.id] }),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const permissionRelations = relations(permissions, ({ many }) => ({
  roles: many(roleToPermission),
}));

export const roleRelations = relations(roles, ({ many }) => ({
  users: many(userToRole),
  permissions: many(roleToPermission),
}));

export const userToRoleRelations = relations(userToRole, ({ one }) => ({
  user: one(users, { fields: [userToRole.userId], references: [users.id] }),
  role: one(roles, { fields: [userToRole.roleId], references: [roles.id] }),
}));

export const roleToPermissionRelations = relations(roleToPermission, ({ one }) => ({
  role: one(roles, { fields: [roleToPermission.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [roleToPermission.permissionId], references: [permissions.id] }),
}));

export const connectionRelations = relations(connections, ({ one }) => ({
  user: one(users, { fields: [connections.userId], references: [users.id] }),
}));
