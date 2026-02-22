import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, studentProcedure } from '../trpc';
import * as db from '../db/queries';
import { validateGPSCheckIn, isWithinTimeWindow } from '../lib/gps';

const GPS_ACCURACY_THRESHOLD = Number(process.env.GPS_ACCURACY_THRESHOLD) || 50;
const GPS_DISTANCE_THRESHOLD = Number(process.env.GPS_DISTANCE_THRESHOLD) || 100;

export const activitiesRouter = router({
  // List activities for current user
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (ctx.user.appRole === 'professor') {
        return await db.getProfessorActivities(ctx.user.id);
      } else {
        return await db.getStudentActivities(ctx.user.id);
      }
    } catch (error) {
      console.error('[Activities] List error:', error);
      // Return empty array instead of throwing to prevent crashes
      return [];
    }
  }),

  // Get activity by ID with enrollment check
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const activity = await db.getActivityById(input.id);

        if (!activity) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Activity not found'
          });
        }

        // Check access: professors can see their activities, students can see enrolled activities
        if (ctx.user.appRole === 'professor') {
          if (activity.professorId !== ctx.user.id) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Not authorized to view this activity'
            });
          }
        } else {
          const isEnrolled = await db.isStudentEnrolled(input.id, ctx.user.id);
          if (!isEnrolled) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Not enrolled in this activity'
            });
          }
        }

        // Get attendance if student
        let attendance = null;
        if (ctx.user.appRole === 'student') {
          attendance = await db.getAttendance(input.id, ctx.user.id);
        }

        return {
          ...activity,
          attendance
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('[Activities] GetById error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch activity'
        });
      }
    }),

  // Create activity (professor only)
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        locationName: z.string().min(1).max(255),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radiusMeters: z.number().int().min(10).max(1000).default(100),
        startTime: z.date(),
        endTime: z.date(),
        studentIds: z.array(z.number()).optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user.appRole !== 'professor') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only professors can create activities'
          });
        }

        // Validate time window
        if (input.endTime <= input.startTime) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'End time must be after start time'
          });
        }

        // Create activity
        const activityId = await db.createActivity({
          professorId: ctx.user.id,
          title: input.title,
          description: input.description,
          locationName: input.locationName,
          latitude: input.latitude.toString(),
          longitude: input.longitude.toString(),
          radiusMeters: input.radiusMeters,
          startTime: input.startTime,
          endTime: input.endTime,
          isActive: true
        });

        // Enroll students if provided
        if (input.studentIds && input.studentIds.length > 0) {
          for (const studentId of input.studentIds) {
            try {
              await db.enrollStudent({ activityId, studentId });
            } catch (error) {
              console.error(`Failed to enroll student ${studentId}:`, error);
            }
          }
        }

        return { success: true, activityId };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('[Activities] Create error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create activity'
        });
      }
    }),

  // Check-in with GPS validation (student only)
  checkIn: studentProcedure
    .input(
      z.object({
        activityId: z.number(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        accuracy: z.number().positive(),
        timestamp: z.date()
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if activity exists
        const activity = await db.getActivityById(input.activityId);
        if (!activity) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Activity not found'
          });
        }

        // Check if student is enrolled
        const isEnrolled = await db.isStudentEnrolled(input.activityId, ctx.user.id);
        if (!isEnrolled) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not enrolled in this activity'
          });
        }

        // Check if already checked in (idempotency)
        const existingAttendance = await db.getAttendance(input.activityId, ctx.user.id);
        if (existingAttendance) {
          return {
            success: false,
            status: existingAttendance.status,
            message: 'Attendance already recorded',
            attendance: existingAttendance
          };
        }

        // Check time window
        if (!isWithinTimeWindow(activity.startTime, activity.endTime)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Activity is not currently active'
          });
        }

        // Validate GPS
        const validation = validateGPSCheckIn({
          userLat: input.latitude,
          userLon: input.longitude,
          userAccuracy: input.accuracy,
          activityLat: parseFloat(activity.latitude),
          activityLon: parseFloat(activity.longitude),
          radiusMeters: activity.radiusMeters,
          accuracyThreshold: GPS_ACCURACY_THRESHOLD
        });

        // Create attendance record
        const attendanceId = await db.createAttendance({
          activityId: input.activityId,
          studentId: ctx.user.id,
          latitude: input.latitude.toString(),
          longitude: input.longitude.toString(),
          accuracy: input.accuracy.toString(),
          distanceMeters: validation.distance.toString(),
          status: validation.status,
          rejectReason: validation.reason
        });

        const attendance = await db.getAttendance(input.activityId, ctx.user.id);

        return {
          success: validation.status === 'accepted',
          status: validation.status,
          message:
            validation.status === 'accepted'
              ? 'Attendance recorded successfully'
              : validation.reason ?? 'Check-in failed',
          distance: validation.distance,
          attendance
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('[Activities] CheckIn error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Check-in failed. Please try again.'
        });
      }
    }),

  // Get activity attendances (professor only)
  getAttendances: protectedProcedure
    .input(z.object({ activityId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        if (ctx.user.appRole !== 'professor') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only professors can view attendances'
          });
        }

        // Verify professor owns activity
        const activity = await db.getActivityById(input.activityId);
        if (!activity || activity.professorId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized to view this activity'
          });
        }

        const attendances = await db.getActivityAttendances(input.activityId);
        const students = await db.getActivityStudents(input.activityId);

        // Combine data
        return students.map((student) => {
          const attendance = attendances.find((a) => a.studentId === student.id);
          return {
            student: {
              id: student.id,
              name: student.name,
              email: student.email
            },
            attendance: attendance ?? null
          };
        });
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('[Activities] GetAttendances error:', error);
        return [];
      }
    }),

  // Enroll student in activity (professor only)
  enrollStudent: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
        studentId: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user.appRole !== 'professor') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only professors can enroll students'
          });
        }

        // Verify professor owns activity
        const activity = await db.getActivityById(input.activityId);
        if (!activity || activity.professorId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized to modify this activity'
          });
        }

        await db.enrollStudent({
          activityId: input.activityId,
          studentId: input.studentId
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('[Activities] EnrollStudent error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to enroll student'
        });
      }
    })
});
