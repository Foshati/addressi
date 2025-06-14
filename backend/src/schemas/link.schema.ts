import { z } from 'zod';

export const LinkSchema = z.object({
  title: z.string().min(3).max(100),
  url: z.string().url(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const createLinkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Invalid URL format'),
  description: z.string().optional(),
  customSlug: z.string().optional(),
});

export const updateLinkSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  url: z.string().url('Invalid URL format').optional(),
  description: z.string().optional(),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
