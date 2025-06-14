import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for analytics creation
const analyticsSchema = z.object({
  type: z.enum(['link_click', 'profile_view']),
  linkId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
});

export const trackAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const validatedData = analyticsSchema.parse(req.body);

    const analytics = await prisma.linkTreeAnalytics.create({
      data: {
        ...validatedData,
        userId,
      },
    });

    return res.status(201).json(analytics);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    console.error('Error tracking analytics:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { startDate, endDate, type } = req.query;

    const where: any = { userId };
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }
    if (type) {
      where.type = type;
    }

    const analytics = await prisma.linkTreeAnalytics.findMany({
      where,
      include: {
        link: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Aggregate analytics data
    const aggregatedData = {
      totalClicks: analytics.filter((a) => a.type === 'link_click').length,
      totalViews: analytics.filter((a) => a.type === 'profile_view').length,
      linkStats: analytics
        .filter((a) => a.type === 'link_click')
        .reduce((acc: any, curr) => {
          if (curr.link) {
            acc[curr.link.id] = (acc[curr.link.id] || 0) + 1;
          }
          return acc;
        }, {}),
    };

    return res.json(aggregatedData);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
