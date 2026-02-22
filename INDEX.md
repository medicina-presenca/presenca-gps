import { router } from '../trpc';
import { authRouter } from './auth';
import { activitiesRouter } from './activities';

export const appRouter = router({
  auth: authRouter,
  activities: activitiesRouter
});

export type AppRouter = typeof appRouter;
