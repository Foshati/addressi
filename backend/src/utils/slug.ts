import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateSlug = async (title: string): Promise<string> => {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingLink = await prisma.link.findFirst({
      where: { slug },
    });

    if (!existingLink) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};
