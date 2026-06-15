import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;
