import { z } from 'zod';

export const googleConfigZod = {
  googleclientId: ['GOOGLE_CLIENT_ID', z.string()],
  googleclientSecret: ['GOOGLE_CLIENT_SECRET', z.string()],
} as const;
