import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { generateSlug } from '../utils/slug';
import { getFavicon } from '../utils/favicon';
import { CustomRequest } from '../types';
import UAParser from 'ua-parser-js';

const prisma = new PrismaClient();

// Create a new link
export const createLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, url, description, customSlug } = req.body;
    const userId = (req as CustomRequest).user?.id;

    // Validate and normalize URL
    let normalizedUrl = url;
    try {
      const urlObj = new URL(url);
      normalizedUrl = urlObj.toString();
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Invalid URL format' });
    }

    if (customSlug) {
      const existingLink = await prisma.link.findFirst({ where: { slug: customSlug } });
      if (existingLink) {
        return res.status(400).json({ success: false, message: 'Custom slug is already taken' });
      }
    }

    const slug = customSlug || (await generateSlug(title));
    const favicon = await getFavicon(normalizedUrl);

    const linkData: Prisma.LinkCreateInput = {
      title,
      url: normalizedUrl,
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

// Create a new guest link (no authentication required)
export const createGuestLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, url, description, customSlug, expiresAt } = req.body;

    // Validate and normalize URL
    let normalizedUrl = url;
    try {
      const urlObj = new URL(url);
      normalizedUrl = urlObj.toString();
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Invalid URL format' });
    }

    if (customSlug) {
      const existingLink = await prisma.link.findFirst({ where: { slug: customSlug } });
      if (existingLink) {
        return res.status(400).json({ success: false, message: 'Custom slug is already taken' });
      }
    }

    const slug = customSlug || (await generateSlug(title));
    const favicon = await getFavicon(normalizedUrl);

    const linkData: Prisma.LinkCreateInput = {
      title,
      url: normalizedUrl,
      slug,
      description,
      favicon,
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days if not provided
      isCustom: !!customSlug,
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
    return next(error);
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

    // Check if link has expired
    if (link.expiresAt && new Date() > link.expiresAt) {
      return res.status(410).json({ success: false, message: 'Link has expired' });
    }

    // Increment overall clicks
    await prisma.link.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    });

    // Capture detailed click data
    const userAgent = req.headers['user-agent'];
    const referrer = req.headers['referer'] || null;
    const ipAddress = req.ip || null; // Express's req.ip might need proxy configuration

    let browser = 'Unknown';
    let os = 'Unknown';
    let deviceType = 'Unknown';

    if (userAgent) {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();
      browser = result.browser.name || 'Unknown';
      os = result.os.name || 'Unknown';
      deviceType = result.device.type || 'desktop'; // 'desktop' is a common default if type is not identified
    }

    await prisma.click.create({
      data: {
        linkId: link.id,
        timestamp: new Date(),
        referrer: referrer,
        ipAddress: ipAddress,
        browser: browser,
        os: os,
        deviceType: deviceType,
        country: 'Unknown', // Placeholder, requires Geo-IP service
      },
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

// Helper function to check link authorization
const checkLinkAuthorization = async (linkId: string, userId?: string) => {
  const link = await prisma.link.findUnique({ where: { id: linkId } });

  if (!link) {
    return { authorized: false, error: 'Link not found', statusCode: 404 };
  }

  // Authorization check:
  // If a user is logged in, the link must belong to that user.
  // If no user is logged in, the link must be a guest link (userId is null).
  if (userId) {
    // User is logged in, check if link belongs to this user
    if (link.userId !== userId) {
      return { authorized: false, error: 'Not authorized to view this link', statusCode: 403 };
    }
  } else {
    // No user is logged in, check if it's a guest link
    if (link.userId !== null) {
      return { authorized: false, error: 'Not authorized to view this link', statusCode: 403 };
    }
  }

  return { authorized: true, link };
};

// Get daily clicks for a specific link
export const getDailyClicksByLink = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { id } = req.params; // Link ID
    const userId = (req as CustomRequest).user?.id;

    const authCheck = await checkLinkAuthorization(id, userId);
    if (!authCheck.authorized) {
      return res.status(authCheck.statusCode!).json({
        success: false,
        message: authCheck.error,
      });
    }

    // Use regular Prisma aggregation instead of raw aggregation for better type safety
    const clicks = await prisma.click.findMany({
      where: { linkId: id },
      select: { timestamp: true },
    });

    // Group clicks by date
    const dailyClicksMap = new Map<string, number>();

    clicks.forEach((click) => {
      const date = click.timestamp.toISOString().split('T')[0]; // Get YYYY-MM-DD format
      dailyClicksMap.set(date, (dailyClicksMap.get(date) || 0) + 1);
    });

    const formattedDailyClicks = Array.from(dailyClicksMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return res.status(200).json({ success: true, data: formattedDailyClicks });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get referrer clicks for a specific link
export const getReferrerClicksByLink = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { id } = req.params; // Link ID
    const userId = (req as CustomRequest).user?.id;

    const authCheck = await checkLinkAuthorization(id, userId);
    if (!authCheck.authorized) {
      return res.status(authCheck.statusCode!).json({
        success: false,
        message: authCheck.error,
      });
    }

    const clicks = await prisma.click.findMany({
      where: {
        linkId: id,
        referrer: { not: null },
      },
      select: { referrer: true },
    });

    // Group clicks by referrer domain
    const referrerClicksMap = new Map<string, number>();

    clicks.forEach((click) => {
      if (click.referrer) {
        try {
          // Extract domain from referrer URL
          const url = new URL(click.referrer);
          const domain = url.hostname;
          referrerClicksMap.set(domain, (referrerClicksMap.get(domain) || 0) + 1);
        } catch {
          // If URL parsing fails, use the referrer as is
          referrerClicksMap.set(click.referrer, (referrerClicksMap.get(click.referrer) || 0) + 1);
        }
      }
    });

    // Add direct traffic count
    const directClicks = await prisma.click.count({
      where: {
        linkId: id,
        OR: [{ referrer: null }, { referrer: '' }],
      },
    });

    if (directClicks > 0) {
      referrerClicksMap.set('Direct', directClicks);
    }

    const formattedReferrerClicks = Array.from(referrerClicksMap.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count);

    return res.status(200).json({ success: true, data: formattedReferrerClicks });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get monthly clicks for a specific link
export const getMonthlyClicksByLink = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { id } = req.params; // Link ID
    const userId = (req as CustomRequest).user?.id;

    const authCheck = await checkLinkAuthorization(id, userId);
    if (!authCheck.authorized) {
      return res.status(authCheck.statusCode!).json({
        success: false,
        message: authCheck.error,
      });
    }

    const clicks = await prisma.click.findMany({
      where: { linkId: id },
      select: { timestamp: true },
    });

    // Group clicks by month
    const monthlyClicksMap = new Map<string, number>();

    clicks.forEach((click) => {
      const month = `${click.timestamp.getFullYear()}-${String(click.timestamp.getMonth() + 1).padStart(2, '0')}`;
      monthlyClicksMap.set(month, (monthlyClicksMap.get(month) || 0) + 1);
    });

    const formattedMonthlyClicks = Array.from(monthlyClicksMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return res.status(200).json({ success: true, data: formattedMonthlyClicks });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get country clicks for a specific link
export const getCountryClicksByLink = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { id } = req.params; // Link ID
    const userId = (req as CustomRequest).user?.id;

    const authCheck = await checkLinkAuthorization(id, userId);
    if (!authCheck.authorized) {
      return res.status(authCheck.statusCode!).json({
        success: false,
        message: authCheck.error,
      });
    }

    const clicks = await prisma.click.findMany({
      where: {
        linkId: id,
        country: {
          not: null,
          notIn: ['Unknown', ''],
        },
      },
      select: { country: true },
    });

    // Group clicks by country
    const countryClicksMap = new Map<string, number>();

    clicks.forEach((click) => {
      if (click.country) {
        countryClicksMap.set(click.country, (countryClicksMap.get(click.country) || 0) + 1);
      }
    });

    const formattedCountryClicks = Array.from(countryClicksMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Limit to top 6 countries

    return res.status(200).json({ success: true, data: formattedCountryClicks });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
