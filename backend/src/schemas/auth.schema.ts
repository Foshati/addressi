// src/schemas/auth.schema.ts
import { z } from "zod";

// Existing schemas remain the same...
export const RegistrationSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(8, "Password must be at least 8 characters")
});

export const OtpVerificationSchema = z.object({
    email: z.string().email("Invalid email format"),
    otp: z.string().length(4, "OTP must be 4 digits"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z.string().min(3, "Username must be at least 3 characters")
});

export const LoginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required")
});

export const ForgotPasswordSchema = z.object({
    email: z.string().email("Invalid email format")
});

export const ForgotPasswordVerificationSchema = z.object({
    email: z.string().email("Invalid email format"),
    otp: z.string().length(6, "OTP must be 6 digits")
});

export const ResetPasswordSchema = z.object({
    email: z.string().email("Invalid email format"),
    newPassword: z.string().min(8, "Password must be at least 8 characters")
});

export const ResendOtpSchema = z.object({
    email: z.string().email("Invalid email format"),
    name: z.string().optional()
});

export const FieldValidationSchema = z.object({
    field: z.enum(["email", "username"], {
        required_error: "Field type is required",
        invalid_type_error: "Field must be either 'email' or 'username'"
    }),
    value: z.string().min(1, "Value is required")
});

// =============================================================================
// TYPE EXPORTS FOR TYPESCRIPT
// =============================================================================

export type RegistrationData = z.infer<typeof RegistrationSchema>;
export type OtpVerificationData = z.infer<typeof OtpVerificationSchema>;
export type LoginData = z.infer<typeof LoginSchema>;
export type ForgotPasswordData = z.infer<typeof ForgotPasswordSchema>;
export type ForgotPasswordVerificationData = z.infer<typeof ForgotPasswordVerificationSchema>;
export type ResetPasswordData = z.infer<typeof ResetPasswordSchema>;
export type ResendOtpData = z.infer<typeof ResendOtpSchema>;
export type FieldValidationData = z.infer<typeof FieldValidationSchema>;
