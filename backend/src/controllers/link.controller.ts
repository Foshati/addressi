import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { generateSlug } from '../utils/slug';
import { getFavicon } from '../utils/favicon';
import { CustomRequest } from '../types';

const prisma = new PrismaClient();

// Create a new link
export const createLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, url, description, customSlug } = req.body;
    const userId = (req as CustomRequest).user?.id;

    if (customSlug) {
      const existingLink = await prisma.link.findFirst({ where: { slug: customSlug } });
      if (existingLink) {
        return res.status(400).json({ success: false, message: 'Custom slug is already taken' });
      }
    }

    const slug = customSlug || (await generateSlug(title));
    const favicon = await getFavicon(url);

    const linkData: Prisma.LinkCreateInput = {
      title,
      url,
      slug,
      description,
      favicon,
      ...(userId ? { user: { connect: { id: userId } } } : {}),
    };

    const link = await prisma.link.create({ data: linkData });
    return res.status(201).json({ success: true, data: link });
  } catch (error) {
    return next(error);
  }
};

// Get links for the authenticated user
export const getMyLinks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as CustomRequest).user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const links = await prisma.link.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: links });
  } catch (error) {
    return next(error);
  }
};

// Get all public links (not associated with a user)
export const getPublicLinks = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const links = await prisma.link.findMany({
      where: { userId: null },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: links });
  } catch (error) {
    next(error);
  }
};

// Get a single link by its slug and handle redirection
export const getLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const link = await prisma.link.findFirst({
      where: { slug, isActive: true },
    });

    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }

    await prisma.link.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    });

    return res.redirect(link.url);
  } catch (error) {
    return next(error);
  }
};

// Get statistics for the authenticated user's links
export const getLinkStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as CustomRequest).user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const stats = await prisma.link.aggregate({
      where: { userId: user.id },
      _count: { _all: true },
      _sum: { clicks: true },
    });

    return res.status(200).json({
      success: true,
      data: {
        totalLinks: stats._count._all,
        totalClicks: stats._sum.clicks || 0,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Update a link
export const updateLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, url, description, isActive } = req.body;
    const userId = (req as CustomRequest).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const link = await prisma.link.findUnique({ where: { id } });

    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }

    if (link.userId !== userId) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to update this link' });
    }

    const updatedLink = await prisma.link.update({
      where: { id },
      data: { title, url, description, isActive },
    });

    return res.status(200).json({ success: true, data: updatedLink });
  } catch (error) {
    return next(error);
  }
};

// Delete a link
export const deleteLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as CustomRequest).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const link = await prisma.link.findUnique({ where: { id } });

    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }

    if (link.userId !== userId) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to delete this link' });
    }

    await prisma.link.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Link deleted successfully' });
  } catch (error) {
    return next(error);
  }
};
