import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../libs/prisma';

// Validation schema for social link creation/update
const socialLinkSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  url: z.string().url('Invalid URL format'),
});

// Validation schema for reordering
const reorderSchema = z.array(
  z.object({
    id: z.string(),
    order: z.number(),
  })
);

// Get all social links for the logged-in user
export const getSocialLinks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const socialLinks = await prisma.socialLink.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });

    return res.json({ success: true, data: socialLinks });
  } catch (error) {
    console.error('Error fetching social links:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new social link
export const createSocialLink = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { platform, url } = socialLinkSchema.parse(req.body);

    // Get the highest current order value to append the new link
    const maxOrder = await prisma.socialLink.aggregate({
      where: { userId },
      _max: { order: true },
    });

    const newLink = await prisma.socialLink.create({
      data: {
        platform,
        url,
        userId,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    return res.status(201).json({ success: true, data: newLink });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    console.error('Error creating social link:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a social link
export const updateSocialLink = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const { platform, url } = socialLinkSchema.parse(req.body);

    const updatedLink = await prisma.socialLink.update({
      where: { id, userId }, // Ensure user can only update their own links
      data: { platform, url },
    });

    return res.json({ success: true, data: updatedLink });
  } catch (error) {
     if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    console.error('Error updating social link:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a social link
export const deleteSocialLink = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;

    await prisma.socialLink.delete({
      where: { id, userId },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting social link:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Reorder social links
export const reorderSocialLinks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const linksToUpdate = reorderSchema.parse(req.body);

    const updatePromises = linksToUpdate.map(link =>
      prisma.socialLink.update({
        where: { id: link.id, userId },
        data: { order: link.order },
      })
    );

    await prisma.$transaction(updatePromises);

    return res.status(200).json({ success: true, message: 'Order updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    console.error('Error reordering social links:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
