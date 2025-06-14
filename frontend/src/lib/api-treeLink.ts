import { z } from 'zod';
import { axiosInstance } from './axiosInstance';

// Zod Schemas for validation
export const linkSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100),
    url: z.string().url('Invalid URL format'),
});

export const profileSchema = z.object({
    name: z.string().min(1, 'Name is required').max(50),
    bio: z.string().max(200).optional(),
    avatarUrl: z.string().url().optional(),
});

export const socialLinkSchema = z.object({
    platform: z.string().min(1),
    url: z.string().url(),
});

// TypeScript Types inferred from Zod schemas
export type Link = z.infer<typeof linkSchema> & { id: string; order: number };
export type Profile = z.infer<typeof profileSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema> & { id: string; order: number };

// API Functions

// Profile
export const getProfile = async (): Promise<Profile> => {
    const response = await axiosInstance.get('/api/v1/linktree/profile');
    return response.data.data;
};

export const updateProfile = async (profileData: Profile): Promise<Profile> => {
    const response = await axiosInstance.put('/api/v1/linktree/profile', profileData);
    return response.data.data;
};

// Links
export const getLinks = async (): Promise<Link[]> => {
    const response = await axiosInstance.get('/api/v1/linktree/links');
    return response.data.data;
};

export const createLink = async (linkData: z.infer<typeof linkSchema>): Promise<Link> => {
    const response = await axiosInstance.post('/api/v1/linktree/links', linkData);
    return response.data.data;
};

export const updateLink = async (id: string, linkData: Partial<z.infer<typeof linkSchema>>): Promise<Link> => {
    const response = await axiosInstance.put(`/api/v1/linktree/links/${id}`, linkData);
    return response.data.data;
};

export const deleteLink = async (id: string): Promise<void> => {
    await axiosInstance.delete(`/api/v1/linktree/links/${id}`);
};

export const reorderLinks = async (links: { id: string; order: number }[]): Promise<void> => {
    await axiosInstance.put('/api/v1/linktree/links/reorder', links);
};

export const updateLinkOrder = async (orderedIds: string[]): Promise<void> => {
    const response = await axiosInstance.post('/api/v1/linktree/links/reorder', { orderedIds });
    if (response.status !== 200) {
        throw new Error('Failed to update link order');
    }
};

// Social Links
export const getSocialLinks = async (): Promise<SocialLink[]> => {
    const response = await axiosInstance.get('/api/v1/social-links');
    return response.data.data;
};

export const createSocialLink = async (linkData: z.infer<typeof socialLinkSchema>): Promise<SocialLink> => {
    const response = await axiosInstance.post('/api/v1/social-links', linkData);
    return response.data.data;
};

export const updateSocialLink = async (id: string, linkData: Partial<z.infer<typeof socialLinkSchema>>): Promise<SocialLink> => {
    const response = await axiosInstance.put(`/api/v1/social-links/${id}`, linkData);
    return response.data.data;
};

export const deleteSocialLink = async (id: string): Promise<void> => {
    await axiosInstance.delete(`/api/v1/social-links/${id}`);
};

export const reorderSocialLinks = async (links: { id: string; order: number }[]): Promise<void> => {
    await axiosInstance.put('/api/v1/social-links/reorder', links);
};

// Analytics
export interface AnalyticsData {
    totalClicks: number;
    clicksPerLink: Record<string, number>;
    // Add other analytics fields as needed
}

export const getAnalytics = async (): Promise<AnalyticsData> => {
    const response = await axiosInstance.get('/api/v1/linktree/analytics');
    return response.data;
};

export const trackAnalytics = async (linkId: string): Promise<void> => {
    await axiosInstance.post('/api/v1/linktree/analytics', { linkId });
};