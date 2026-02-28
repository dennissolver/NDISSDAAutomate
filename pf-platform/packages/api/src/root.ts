import { router } from './trpc';
import { propertyRouter } from './routers/property.router';
import { participantRouter } from './routers/participant.router';
import { reconciliationRouter } from './routers/reconciliation.router';
import { claimRouter } from './routers/claim.router';
import { clientRouter } from './routers/client.router';
import { exceptionRouter } from './routers/exception.router';
import { calculatorRouter } from './routers/calculator.router';
import { dashboardRouter } from './routers/dashboard.router';
import { authRouter } from './routers/auth.router';
import { uploadRouter } from './routers/upload.router';

export const appRouter = router({
  property: propertyRouter,
  participant: participantRouter,
  reconciliation: reconciliationRouter,
  claim: claimRouter,
  client: clientRouter,
  exception: exceptionRouter,
  calculator: calculatorRouter,
  dashboard: dashboardRouter,
  auth: authRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;
