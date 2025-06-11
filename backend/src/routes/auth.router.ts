// src/routes/auth.routes.ts
import express, { Router, type RequestHandler } from "express";
import {
    getUser,
    resendOtp,
    userForgotPassword,
    userLogin,
    userRefreshToken,
    userRegistration,
    userResetPassword,
    userVerify,
    userVerifyForgotPasswordOtp,
    validateField,
} from "../controllers/auth.controller";

import {
    RegistrationSchema,
    OtpVerificationSchema,
    LoginSchema,
    ForgotPasswordSchema,
    ForgotPasswordVerificationSchema,
    ResetPasswordSchema,
    ResendOtpSchema,
    FieldValidationSchema,
} from "../schemas/auth.schema";
import { validate } from "../utils/error-handler";
import { isAuthenticated } from "../utils/middleware/middleware";

const router: Router = express.Router();

// =============================================================================
// PUBLIC ROUTES (No Authentication Required)
// =============================================================================

// Authentication endpoints
router.post(
    "/api/v1/auth/register",
    validate(RegistrationSchema),
    userRegistration
);
router.post("/api/v1/auth/verify", validate(OtpVerificationSchema), userVerify);
router.post("/api/v1/auth/login", validate(LoginSchema), userLogin);
router.post("/api/v1/auth/refresh-token", userRefreshToken);

// Password management
router.post(
    "/api/v1/auth/forgot-password",
    validate(ForgotPasswordSchema),
    userForgotPassword
);
router.post(
    "/api/v1/auth/forgot-password/verify",
    validate(ForgotPasswordVerificationSchema),
    userVerifyForgotPasswordOtp
);
router.post(
    "/api/v1/auth/reset-password",
    validate(ResetPasswordSchema),
    userResetPassword
);

// Utility endpoints
router.post("/api/v1/utils/resend-otp", validate(ResendOtpSchema), resendOtp);
router.post(
    "/api/v1/utils/validate-field",
    validate(FieldValidationSchema),
    validateField
);

// =============================================================================
// PROTECTED ROUTES (Authentication Required)
// =============================================================================

// User profile
router.get(
    "/api/v1/user/me",
    isAuthenticated as unknown as RequestHandler,
    getUser
);

export default router;
