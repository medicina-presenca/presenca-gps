import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  int,
  decimal,
  mysqlEnum,
  index,
  unique
} from 'drizzle-orm/mysql-core';

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  appRole: mysqlEnum('app_role', ['professor', 'student']).notNull().default('student'),
  approvalStatus: mysqlEnum('approval_status', ['pending', 'approved', 'rejected'])
    .notNull()
    .default('approved'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastSignedIn: timestamp('last_signed_in')
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
  appRoleIdx: index('app_role_idx').on(table.appRole)
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Allowed Domains ──────────────────────────────────────────────────────────
export const allowedDomains = mysqlTable('allowed_domains', {
  id: serial('id').primaryKey(),
  domain: varchar('domain', { length: 255 }).notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export type AllowedDomain = typeof allowedDomains.$inferSelect;
export type InsertAllowedDomain = typeof allowedDomains.$inferInsert;

// ─── Password Reset Tokens ────────────────────────────────────────────────────
export const passwordResetTokens = mysqlTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: int('user_id').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  tokenIdx: index('token_idx').on(table.token),
  userIdx: index('user_idx').on(table.userId)
}));

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// ─── Activities (Agendas) ─────────────────────────────────────────────────────
export const activities = mysqlTable('activities', {
  id: serial('id').primaryKey(),
  professorId: int('professor_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  locationName: varchar('location_name', { length: 255 }).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  radiusMeters: int('radius_meters').notNull().default(100),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
}, (table) => ({
  professorIdx: index('professor_idx').on(table.professorId),
  timeIdx: index('time_idx').on(table.startTime, table.endTime),
  activeIdx: index('active_idx').on(table.isActive)
}));

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

// ─── Activity Enrollments ─────────────────────────────────────────────────────
export const activityEnrollments = mysqlTable('activity_enrollments', {
  id: serial('id').primaryKey(),
  activityId: int('activity_id').notNull(),
  studentId: int('student_id').notNull(),
  enrolledAt: timestamp('enrolled_at').notNull().defaultNow()
}, (table) => ({
  activityStudentUniq: unique('activity_student_unique').on(table.activityId, table.studentId),
  activityIdx: index('activity_idx').on(table.activityId),
  studentIdx: index('student_idx').on(table.studentId)
}));

export type ActivityEnrollment = typeof activityEnrollments.$inferSelect;
export type InsertActivityEnrollment = typeof activityEnrollments.$inferInsert;

// ─── Attendances ──────────────────────────────────────────────────────────────
export const attendances = mysqlTable('attendances', {
  id: serial('id').primaryKey(),
  activityId: int('activity_id').notNull(),
  studentId: int('student_id').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  accuracy: decimal('accuracy', { precision: 8, scale: 2 }).notNull(),
  distanceMeters: decimal('distance_meters', { precision: 8, scale: 2 }).notNull(),
  status: mysqlEnum('status', ['accepted', 'rejected', 'pending'])
    .notNull()
    .default('pending'),
  rejectReason: text('reject_reason'),
  checkedInAt: timestamp('checked_in_at').notNull().defaultNow(),
  validatedAt: timestamp('validated_at')
}, (table) => ({
  activityStudentUniq: unique('attendance_unique').on(table.activityId, table.studentId),
  activityIdx: index('activity_idx').on(table.activityId),
  studentIdx: index('student_idx').on(table.studentId),
  statusIdx: index('status_idx').on(table.status)
}));

export type Attendance = typeof attendances.$inferSelect;
export type InsertAttendance = typeof attendances.$inferInsert;
