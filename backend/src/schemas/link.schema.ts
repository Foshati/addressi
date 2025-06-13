import { z } from 'zod';

export const LinkSchema = z.object({
  title: z.string().min(3).max(100),
  url: z.string().url(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});
