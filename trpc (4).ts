import { eq, and, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { getDb, schema } from './index';
import type { InsertUser, InsertAllowedDomain, InsertActivity, InsertActivityEnrollment, InsertAttendance } from './schema';

// ─── Users ────────────────────────────────────────────────────────────────────

export async function createUser(data: InsertUser) {
  const db = await getDb();
  const [result] = await db.insert(schema.users).values(data);
  return result.insertId;
}

export async function getUserByEmail(email: string) {
  try {
    const db = await getDb();
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    return user;
  } catch (error) {
    console.error('[DB] getUserByEmail error:', error);
    return undefined;
  }
}

export async function getUserById(id: number) {
  try {
    const db = await getDb();
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return user;
  } catch (error) {
    console.error('[DB] getUserById error:', error);
    return undefined;
  }
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  await db
    .update(schema.users)
    .set({ passwordHash })
    .where(eq(schema.users.id, userId));
}

export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  await db
    .update(schema.users)
    .set({ lastSignedIn: new Date() })
    .where(eq(schema.users.id, userId));
}

export async function updateUserAppRole(userId: number, appRole: 'professor' | 'student') {
  const db = await getDb();
  await db
    .update(schema.users)
    .set({ appRole })
    .where(eq(schema.users.id, userId));
}

// ─── Allowed Domains ──────────────────────────────────────────────────────────

export async function getActiveDomains(): Promise<string[]> {
  try {
    const db = await getDb();
    const domains = await db
      .select({ domain: schema.allowedDomains.domain })
      .from(schema.allowedDomains)
      .where(eq(schema.allowedDomains.isActive, true));
    return domains.map(d => d.domain);
  } catch (error) {
    console.error('[DB] getActiveDomains error:', error);
    return [];
  }
}

export async function addAllowedDomain(domain: string) {
  const db = await getDb();
  await db.insert(schema.allowedDomains).values({ domain, isActive: true });
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function createPasswordResetToken(userId: number, token: string) {
  const db = await getDb();
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour
  await db.insert(schema.passwordResetTokens).values({
    userId,
    token,
    expiresAt
  });
}

export async function getPasswordResetToken(token: string) {
  try {
    const db = await getDb();
    const [record] = await db
      .select()
      .from(schema.passwordResetTokens)
      .where(eq(schema.passwordResetTokens.token, token))
      .limit(1);
    return record;
  } catch (error) {
    console.error('[DB] getPasswordResetToken error:', error);
    return undefined;
  }
}

export async function markPasswordResetTokenUsed(tokenId: number) {
  const db = await getDb();
  await db
    .update(schema.passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(schema.passwordResetTokens.id, tokenId));
}

// ─── Activities ───────────────────────────────────────────────────────────────

export async function createActivity(data: InsertActivity) {
  const db = await getDb();
  const [result] = await db.insert(schema.activities).values(data);
  return result.insertId;
}

export async function getActivityById(id: number) {
  try {
    const db = await getDb();
    const [activity] = await db
      .select()
      .from(schema.activities)
      .where(eq(schema.activities.id, id))
      .limit(1);
    return activity;
  } catch (error) {
    console.error('[DB] getActivityById error:', error);
    return undefined;
  }
}

export async function getProfessorActivities(professorId: number) {
  try {
    const db = await getDb();
    return await db
      .select()
      .from(schema.activities)
      .where(eq(schema.activities.professorId, professorId))
      .orderBy(schema.activities.startTime);
  } catch (error) {
    console.error('[DB] getProfessorActivities error:', error);
    return [];
  }
}

export async function getStudentActivities(studentId: number) {
  try {
    const db = await getDb();
    // Get enrolled activity IDs
    const enrollments = await db
      .select({ activityId: schema.activityEnrollments.activityId })
      .from(schema.activityEnrollments)
      .where(eq(schema.activityEnrollments.studentId, studentId));

    if (enrollments.length === 0) return [];

    const activityIds = enrollments.map(e => e.activityId);

    // Get activities
    return await db
      .select()
      .from(schema.activities)
      .where(inArray(schema.activities.id, activityIds))
      .orderBy(schema.activities.startTime);
  } catch (error) {
    console.error('[DB] getStudentActivities error:', error);
    return [];
  }
}

export async function updateActivity(id: number, data: Partial<InsertActivity>) {
  const db = await getDb();
  await db
    .update(schema.activities)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.activities.id, id));
}

export async function deleteActivity(id: number) {
  const db = await getDb();
  await db.delete(schema.activities).where(eq(schema.activities.id, id));
}

// ─── Activity Enrollments ─────────────────────────────────────────────────────

export async function enrollStudent(data: InsertActivityEnrollment) {
  try {
    const db = await getDb();
    const [result] = await db
      .insert(schema.activityEnrollments)
      .values(data)
      .onDuplicateKeyUpdate({ set: { enrolledAt: new Date() } });
    return result.insertId;
  } catch (error) {
    console.error('[DB] enrollStudent error:', error);
    throw error;
  }
}

export async function isStudentEnrolled(activityId: number, studentId: number): Promise<boolean> {
  try {
    const db = await getDb();
    const [enrollment] = await db
      .select()
      .from(schema.activityEnrollments)
      .where(
        and(
          eq(schema.activityEnrollments.activityId, activityId),
          eq(schema.activityEnrollments.studentId, studentId)
        )
      )
      .limit(1);
    return !!enrollment;
  } catch (error) {
    console.error('[DB] isStudentEnrolled error:', error);
    return false;
  }
}

export async function getActivityStudents(activityId: number) {
  try {
    const db = await getDb();
    const enrollments = await db
      .select({
        studentId: schema.activityEnrollments.studentId,
        enrolledAt: schema.activityEnrollments.enrolledAt
      })
      .from(schema.activityEnrollments)
      .where(eq(schema.activityEnrollments.activityId, activityId));

    if (enrollments.length === 0) return [];

    const studentIds = enrollments.map(e => e.studentId);
    const students = await db
      .select()
      .from(schema.users)
      .where(inArray(schema.users.id, studentIds));

    return students;
  } catch (error) {
    console.error('[DB] getActivityStudents error:', error);
    return [];
  }
}

// ─── Attendances ──────────────────────────────────────────────────────────────

export async function createAttendance(data: InsertAttendance) {
  try {
    const db = await getDb();
    const [result] = await db.insert(schema.attendances).values(data);
    return result.insertId;
  } catch (error: any) {
    // Check for duplicate entry error
    if (error?.code === 'ER_DUP_ENTRY') {
      throw new Error('Attendance already recorded for this activity');
    }
    console.error('[DB] createAttendance error:', error);
    throw error;
  }
}

export async function getAttendance(activityId: number, studentId: number) {
  try {
    const db = await getDb();
    const [attendance] = await db
      .select()
      .from(schema.attendances)
      .where(
        and(
          eq(schema.attendances.activityId, activityId),
          eq(schema.attendances.studentId, studentId)
        )
      )
      .limit(1);
    return attendance;
  } catch (error) {
    console.error('[DB] getAttendance error:', error);
    return undefined;
  }
}

export async function getActivityAttendances(activityId: number) {
  try {
    const db = await getDb();
    return await db
      .select()
      .from(schema.attendances)
      .where(eq(schema.attendances.activityId, activityId));
  } catch (error) {
    console.error('[DB] getActivityAttendances error:', error);
    return [];
  }
}

export async function updateAttendanceStatus(
  id: number,
  status: 'accepted' | 'rejected' | 'pending',
  rejectReason?: string
) {
  const db = await getDb();
  await db
    .update(schema.attendances)
    .set({
      status,
      rejectReason: rejectReason ?? null,
      validatedAt: new Date()
    })
    .where(eq(schema.attendances.id, id));
}
