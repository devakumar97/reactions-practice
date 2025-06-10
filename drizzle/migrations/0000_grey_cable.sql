CREATE TYPE "public"."course_level" AS ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED');--> statement-breakpoint
CREATE TABLE "Connection" (
	"id" text PRIMARY KEY NOT NULL,
	"providerName" text NOT NULL,
	"providerId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Course" (
	"id" text PRIMARY KEY NOT NULL,
	"duration" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"ownerId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CourseImage" (
	"id" text PRIMARY KEY NOT NULL,
	"altText" text,
	"contentType" text NOT NULL,
	"blob" "bytea" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"courseId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CourseTranslation" (
	"courseId" text NOT NULL,
	"languageId" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"level" "course_level" NOT NULL,
	CONSTRAINT "CourseTranslation_courseId_languageId_pk" PRIMARY KEY("courseId","languageId")
);
--> statement-breakpoint
CREATE TABLE "Language" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Password" (
	"hash" text NOT NULL,
	"userId" text NOT NULL,
	CONSTRAINT "Password_userId_key" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "Permission" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"access" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_PermissionToRole" (
	"permissionId" text NOT NULL,
	"roleId" text NOT NULL,
	CONSTRAINT "_PermissionToRole_permissionId_roleId_pk" PRIMARY KEY("permissionId","roleId")
);
--> statement-breakpoint
CREATE TABLE "Role" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Role_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "_RoleToUser" (
	"roleId" text NOT NULL,
	"userId" text NOT NULL,
	CONSTRAINT "_RoleToUser_userId_roleId_pk" PRIMARY KEY("userId","roleId")
);
--> statement-breakpoint
CREATE TABLE "Session" (
	"id" text PRIMARY KEY NOT NULL,
	"expirationDate" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"name" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_key" UNIQUE("email"),
	CONSTRAINT "User_username_key" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "UserImage" (
	"id" text PRIMARY KEY NOT NULL,
	"altText" text,
	"contentType" text NOT NULL,
	"blob" "bytea" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"userId" text NOT NULL,
	CONSTRAINT "UserImage_userId_key" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "Verification" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"type" text NOT NULL,
	"target" text NOT NULL,
	"secret" text NOT NULL,
	"algorithm" text NOT NULL,
	"digits" integer NOT NULL,
	"period" integer NOT NULL,
	"charSet" text NOT NULL,
	"expiresAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Course" ADD CONSTRAINT "Course_ownerId_User_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CourseImage" ADD CONSTRAINT "CourseImage_courseId_Course_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CourseTranslation" ADD CONSTRAINT "CourseTranslation_courseId_Course_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CourseTranslation" ADD CONSTRAINT "CourseTranslation_languageId_Language_id_fk" FOREIGN KEY ("languageId") REFERENCES "public"."Language"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Password" ADD CONSTRAINT "Password_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_permissionId_Permission_id_fk" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_roleId_Role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_roleId_Role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "UserImage" ADD CONSTRAINT "UserImage_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Connection_providerName_providerId_key" ON "Connection" USING btree ("providerName","providerId");--> statement-breakpoint
CREATE INDEX "Course_ownerId_updatedAt_idx" ON "Course" USING btree ("ownerId","updatedAt");--> statement-breakpoint
CREATE INDEX "Course_ownerId_idx" ON "Course" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "CourseImage_courseId_idx" ON "CourseImage" USING btree ("courseId");--> statement-breakpoint
CREATE UNIQUE INDEX "Permission_action_entity_access_key" ON "Permission" USING btree ("action","entity","access");--> statement-breakpoint
CREATE INDEX "PermissionToRole_roleId_idx" ON "_PermissionToRole" USING btree ("roleId");--> statement-breakpoint
CREATE INDEX "RoleToUser_userId_idx" ON "_RoleToUser" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Session_userId_idx" ON "Session" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "Verification_target_type_key" ON "Verification" USING btree ("target","type");