import { type User, type UserLink } from "@/server-link/db/schema";

export type UserWithLink = User & { userLink?: UserLink };

export type SafeActionError = {
  serverError?: string;
  fetchError?: string;
  validationErrors?: Record<string, string[]>;
};
