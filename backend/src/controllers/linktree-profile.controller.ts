import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../libs/prisma';

// Validation schema for profile update
const profileUpdateSchema = z.object({
  theme: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  buttonStyle: z.string().optional(),
  socialLinks: z.record(z.string()).optional(),
});

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    let profile = await prisma.linkTreeProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // If profile doesn't exist, create a new one for the user
      profile = await prisma.linkTreeProfile.create({
        data: {
          userId,
          // You can add any default values here, e.g., theme, etc.
        },
      });
    }

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const validatedData = profileUpdateSchema.parse(req.body);

    const profile = await prisma.linkTreeProfile.upsert({
      where: { userId },
      update: validatedData,
      create: {
        ...validatedData,
        userId,
      },
    });

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: error.errors,
      });
    }
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    await prisma.linkTreeProfile.delete({
      where: { userId },
    });

    return res.json({
      success: true,
      message: 'Profile deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
