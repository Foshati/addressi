import { z } from "zod";

// User Schema
export const userSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email(),
  emailVerified: z.date().optional(),
  image: z.string().optional(),
  createdAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

// Account Schema
export const accountSchema = z.object({
  userId: z.string(),
  type: z.string(),
  provider: z.string(),
  providerAccountId: z.string(),
  refresh_token: z.string().optional(),
  access_token: z.string().optional(),
  expires_at: z.number().optional(),
  token_type: z.string().optional(),
  scope: z.string().optional(),
  id_token: z.string().optional(),
  session_state: z.string().optional(),
  createdAt: z.date(),
});

export type Account = z.infer<typeof accountSchema>;

// Session Schema
export const sessionSchema = z.object({
  sessionToken: z.string(),
  userId: z.string(),
  expires: z.date(),
  createdAt: z.date(),
});

export type Session = z.infer<typeof sessionSchema>;

// Verification Token Schema
export const verificationTokenSchema = z.object({
  identifier: z.string(),
  token: z.string(),
  expires: z.date(),
  createdAt: z.date(),
});

export type VerificationToken = z.infer<typeof verificationTokenSchema>;

// UserLink Schema
export const userLinkSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  totalLinks: z.number().default(0),
  createdAt: z.date(),
});

export type UserLink = z.infer<typeof userLinkSchema>;
export type NewUserLink = z.infer<typeof userLinkSchema>;

// Link Schema
export const linkSchema = z.object({
  slug: z.string().max(30),
  userLinkId: z.string(),
  description: z.string().max(255).optional(),
  url: z.string().url(),
  clicks: z.number().default(0),
  createdAt: z.date(),
});

export type ShortLink = z.infer<typeof linkSchema>;
export type NewShortLink = z.infer<typeof linkSchema>;

// Input Schemas for API
export const createUserSchema = userSchema.omit({ id: true, createdAt: true });
export const createLinkSchema = linkSchema.omit({ clicks: true, createdAt: true });
export const updateLinkSchema = linkSchema.partial().omit({ slug: true, userLinkId: true, createdAt: true });
export const createUserLinkSchema = userLinkSchema.omit({ id: true, createdAt: true }); 