
import type { Request, Response, NextFunction } from "express";
import { type AnyZodObject, ZodError } from "zod";

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly details: unknown;

    constructor(
        message: string,
        statusCode: number,
        isOperational = true,
        details?: unknown
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}


// Not found error (use for 404 errors)
export class NotFoundError extends AppError {
    constructor(message = "Resource not found", details?: unknown) {
        super(message, 404, true, details);
    }
}

// Validation error (use for joi/zod/react-hook-form validation errors)
export class ValidationError extends AppError {
    constructor(message = "Validation error", details?: unknown) {
        super(message, 400, true, details);
    }
}

// Authentication error (use for authentication errors)
export class AuthError extends AppError {
    constructor(message = "Authentication error", details?: unknown) {
        super(message, 401, true, details);
    }
}
// Authorization error or Forbidden error (use for authorization errors)
export class ForbiddenError extends AppError {
    constructor(message = "Forbidden access", details?: unknown) {
        super(message, 403, true, details);
    }
}

// Database error (use for database errors)
export class DatabaseError extends AppError {
    constructor(message = "Database error", details?: unknown) {
        super(message, 500, true, details);
    }
}
// Rate limit error (use for rate limit errors)
export class RateLimitError extends AppError {
    constructor(message = "Rate limit exceeded", details?: unknown) {
        super(message, 429, true, details);
    }
}
// Validate middleware
export const validate = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        await schema.parseAsync(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            // Format Zod errors in a more user-friendly way
            const errorMessages = error.errors.map(err => {
                return `${err.path.join('.')}: ${err.message}`;
            }).join(', ');

            return next(new ValidationError(errorMessages));
        }
        next(error);
    }
};