import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../libs/prisma';

// Validation schema for link creation/update
const linkSchema = z.object({
  title: z.string().min(1).max(100),
  url: z.string().url(),
  icon: z.string().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const getLinks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const links = await prisma.linkTreeLink.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });

    return res.json({
      success: true,
      data: links,
    });
  } catch (error) {
    console.error('Error fetching links:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createLink = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const validatedData = linkSchema.parse(req.body);

    const link = await prisma.linkTreeLink.create({
      data: {
        ...validatedData,
        userId,
      },
    });

    return res.status(201).json({
      success: true,
      data: link,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: error.errors,
      });
    }
    console.error('Error creating link:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateLink = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const linkId = req.params.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const validatedData = linkSchema.parse(req.body);

    const link = await prisma.linkTreeLink.update({
      where: {
        id: linkId,
        userId,
      },
      data: validatedData,
    });

    return res.json({
      success: true,
      data: link,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: error.errors,
      });
    }
    console.error('Error updating link:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteLink = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const linkId = req.params.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    await prisma.linkTreeLink.delete({
      where: {
        id: linkId,
        userId,
      },
    });

    return res.json({
      success: true,
      message: 'Link deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting link:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const reorderLinks = async (req: Request, res: Response) => {
  const { orderedIds } = req.body;
  const userId = (req.user as any)?.id;

  if (!orderedIds || !Array.isArray(orderedIds)) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const linkId = orderedIds[i];
        await tx.linkTreeLink.updateMany({
          where: {
            id: linkId,
            userId: userId,
          },
          data: {
            order: i,
          },
        });
      }
    });

    res.status(200).json({ message: 'Links reordered successfully' });
  } catch (error) {
    console.error('Failed to reorder links:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
