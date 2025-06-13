import axios from 'axios';
import { parse, resolve } from 'url';
import * as cheerio from 'cheerio';

export const getFavicon = async (url: string): Promise<string | null> => {
  try {
    const parsedUrl = parse(url);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

    console.log(`[Favicon] Trying to get favicon for: ${url}`);

    // Step 1: Try to get favicon from HTML meta tags
    try {
      const response = await axios.get(url, { timeout: 7000 });
      const $ = cheerio.load(response.data);

      const iconUrls: string[] = [];

      $('link[rel*="icon"]').each((_i, element) => {
        const href = $(element).attr('href');
        if (href) {
          const resolvedUrl = resolve(url, href);
          iconUrls.push(resolvedUrl);
          console.log(`[Favicon] Found potential icon in HTML: ${resolvedUrl}`);
        }
      });

      iconUrls.sort((a, b) => {
        const sizeA = parseInt(a.match(/size=(\d+)/)?.[1] || '0');
        const sizeB = parseInt(b.match(/size=(\d+)/)?.[1] || '0');
        return sizeB - sizeA;
      });

      for (const iconUrl of iconUrls) {
        try {
          await axios.head(iconUrl, { timeout: 5000 });
          console.log(`[Favicon] Successfully validated icon: ${iconUrl}`);
          return iconUrl;
        } catch (error) {
          console.warn(`[Favicon] Could not validate icon ${iconUrl}:`, error.message);
          // Ignore error and try next favicon
        }
      }
    } catch (error) {
      console.warn(`[Favicon] Could not fetch/parse HTML for ${url}:`, error.message);
    }

    // Step 2: Fallback to common locations
    console.log(`[Favicon] Falling back to common locations for: ${url}`);
    const faviconPaths = ['/favicon.ico', '/apple-touch-icon.png', '/favicon.png'];
    for (const path of faviconPaths) {
      try {
        const faviconUrl = `${baseUrl}${path}`;
        await axios.head(faviconUrl, { timeout: 5000 });
        console.log(`[Favicon] Successfully found common icon: ${faviconUrl}`);
        return faviconUrl;
      } catch (error) {
        console.warn(`[Favicon] Could not find common icon ${baseUrl}${path}:`, error.message);
        continue;
      }
    }

    console.log(`[Favicon] No favicon found for: ${url}`);
    return null;
  } catch (error) {
    console.error(`[Favicon] General error in getFavicon for ${url}:`, error.message);
    return null;
  }
};
