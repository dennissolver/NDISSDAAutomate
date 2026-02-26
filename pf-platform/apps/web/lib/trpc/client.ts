'use client';

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@pf/api';

export const trpc = createTRPCReact<AppRouter>();
