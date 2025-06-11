import type { NextFunction, Response } from "express";

type Role = "USER" | "SELLER" | "ADMIN";

/**
 * Middleware to authorize user roles
 * SELLER role inherits all USER permissions
 * ADMIN role inherits all SELLER and USER permissions
 */
export const authorizeRoles = (...requiredRoles: Role[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const userRole = req.user.role;
    
    // Role inheritance logic
    let hasAccess = false;
    
    if (requiredRoles.includes(userRole)) {
      hasAccess = true;
    } else {
      // Handle role inheritance
      if (userRole === "ADMIN") {
        // Admin has access to everything
        hasAccess = true;
      } else if (userRole === "SELLER" && 
                (requiredRoles.includes("USER"))) {
        // SELLER inherits USER permissions
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({
        message: `Access denied. Required role: ${requiredRoles.join(" or ")}`
      });
    }

    next();
  };
};
