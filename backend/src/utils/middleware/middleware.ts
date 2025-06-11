import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from "../db/prisma";

/**
 * Authentication middleware
 * Verifies the JWT token from cookies or Authorization header
 * and attaches the user object to the request
 */
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies?.access_token || req.headers.authorization?.split(" ")[1];

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Authentication token missing"
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(
                token,
                process.env.ACCESS_TOKEN_SECRET as string
            ) as {
                id: string;
                role: Role;
            };

            // Validate decoded token structure
            if (!decoded || !decoded.id) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid authentication token structure"
                });
            }

            // Validate that user exists in database
            const user = await prisma.user.findUnique({ 
                where: { id: decoded.id } 
            });
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User account not found"
                });
            }

            // Attach the user object to the request
            req.user = user;
            return next();
        } catch (jwtError) {
            if (jwtError instanceof jwt.TokenExpiredError) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication token expired",
                    expired: true
                });
            }
            
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
        }
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during authentication"
        });
    }
};

/**
 * Role-based access control middleware
 * Checks if the authenticated user has one of the required roles
 * @param allowedRoles Array of roles that are allowed to access the route
 */
export const requireRole = (allowedRoles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // First check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // Check if user has one of the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
            });
        }

        // User has the required role, proceed
        return next();
    };
};