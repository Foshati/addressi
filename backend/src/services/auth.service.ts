/* eslint-disable @typescript-eslint/no-unused-vars */
import crypto from "crypto"
import { sendEmail } from "../utils/sendMail";
import type { NextFunction, Request, Response } from "express";
import { ValidationError } from "../utils/error-handler";
import prisma from "../utils/db/prisma";
import { redis } from "utils/db/redis";



type RegistrationDataType = {
    name: string;
    username: string;
    email: string;
    password: string;
    phone_number?: string;
    country?: string;
};

// This validation function is redundant with Zod schemas
// Consider removing this entirely as Zod now handles validation
export const validateRegistrationData = (
    data: RegistrationDataType,
    userType: "user" | "seller"
): void => {
    const { name, username, email, password, phone_number, country } = data;

    // Check required fields
    if (
        !name ||
        !username ||
        !email ||
        !password ||
        (userType === "seller" && (!phone_number || !country))
    ) {
        throw new ValidationError("Missing required fields");
    }

    // These validations are now handled by Zod
    // Consider removing them entirely
};

export const checkOtpRestrictions = async (email: string, next: NextFunction): Promise<boolean> => {
    if (await redis.get(`otp_lock:${email}`)) {
        next(new ValidationError("Account locked due to multiple failed OTP attempts. Please try again after 30 minutes"));
        return true;
    }
    if (await redis.get(`otp_spam_lock:${email}`)) {
        next(new ValidationError("Too many OTP requests. Please wait 1 hour before requesting again"));
        return true;
    }
    if (await redis.get(`otp_cooldown:${email}`)) {
        next(new ValidationError("Please wait 1 minute before requesting another OTP"));
        return true;
    }
    return false;
};

export const trackOtpRequests = async (email: string, next: NextFunction): Promise<boolean> => {
    try {
        const otpRequestKey = `otp_request_count:${email}`;
        const otpRequests = parseInt((await redis.get(otpRequestKey)) || "0", 10);

        if (otpRequests >= 2) {
            await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600);
            next(new ValidationError("Too many OTP requests. Please wait 1 hour before requesting again"));
            return true;
        }

        await redis.set(otpRequestKey, (otpRequests + 1).toString(), "EX", 3600);
        return false;
    } catch (error) {
        next(new ValidationError("Error tracking OTP requests"));
        return true;
    }
};

export const sendOtp = async (name: string, email: string, template: string): Promise<boolean> => {
    try {
        // Update to generate 4-digit OTP to match schema validation
        const otp = crypto.randomInt(1000, 9999).toString();

        // Send verification email
        const emailSent = await sendEmail(email, "Verify your email", template, { name, otp });
        
        // If email sending failed, throw error
        if (!emailSent) {
            console.error(`Failed to send email to ${email} using template ${template}`);
            throw new ValidationError("Error sending email. Please check SMTP settings or try again later.");
        }

        // Store OTP and cooldown in Redis
        await redis.set(`otp:${email}`, otp, "EX", 300);
        await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);
        return true;
    } catch (error) {
        console.error('Error in sendOtp:', error);
        throw new ValidationError("Error sending OTP. Please try again later.");
    }
};

export const verifyOtp = async (email: string, otp: string): Promise<void> => {
    const storedOtp = await redis.get(`otp:${email}`);
    if (!storedOtp) {
        throw new ValidationError("Invalid or expired OTP");
    }

    const failedAttemptsKey = `otp_failed_attempts:${email}`;
    const failedAttempts = parseInt((await redis.get(failedAttemptsKey)) || "0", 10);

    if (storedOtp !== otp) {
        if (failedAttempts >= 2) {
            await redis.set(`otp_lock:${email}`, "locked", "EX", 1800);
            await redis.del(failedAttemptsKey);
            throw new ValidationError("Too many failed attempts. Account locked for 30 minutes");
        }
        await redis.set(failedAttemptsKey, (failedAttempts + 1).toString(), "EX", 300);
        throw new ValidationError(`Incorrect OTP, you have ${2 - failedAttempts} attempt(s) left`);
    }

    await redis.del(`otp:${email}`);
    await redis.del(failedAttemptsKey);
};

export const handleForgotPassword = async (req: Request, res: Response, next: NextFunction, userType: "user" | "seller") => {
    try {
        const { email } = req.body;
        if (!email) throw new ValidationError("Email is required");
        // Find user / seller in db
        const user = userType === "user" && await prisma.user.findUnique({ where: { email } })
        if (!user) throw new ValidationError(`${userType} not found`);

        // check otp restrictions
        await checkOtpRestrictions(email, next);
        await trackOtpRequests(email, next);

        // Generate OTP and send email
        await sendOtp(user.name, user.email, "forgot-password-user-mail");

        res.status(200).json({ message: "OTP sent to email, please verify your account" })
    } catch (error) {
        next(error);
    }
}

export const verifyForgotPasswordOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            throw new ValidationError("email and otp are required");
        }
        await verifyOtp(email, otp);
        res.status(200).json({ message: "OTP verified, You can now reset your password", success: true });

    } catch (error) {
        next(error);
    }
}