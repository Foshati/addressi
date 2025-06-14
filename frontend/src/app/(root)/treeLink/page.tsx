'use client';

import { useQuery } from '@tanstack/react-query';
import { getProfile, getLinks, getSocialLinks } from '@/lib/api-treeLink';
import ProfileForm from '@/components/treeLink/ProfileForm';
import LinkList from '@/components/treeLink/LinkList';
import SocialLinksList from '@/components/treeLink/SocialLinksList';
import PhoneMockup from '@/components/treeLink/PhoneMockup';
import { Skeleton } from '@/components/ui/skeleton';

export default function TreeLinkPage() {
  const { data: profile, isLoading: isLoadingProfile, error: profileError } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile
  });

  const { data: links, isLoading: isLoadingLinks, error: linksError } = useQuery({
    queryKey: ['links'],
    queryFn: getLinks
  });

  const { data: socialLinks, isLoading: isLoadingSocialLinks, error: socialLinksError } = useQuery({
    queryKey: ['socialLinks'],
    queryFn: getSocialLinks
  });

  if (isLoadingProfile || isLoadingLinks || isLoadingSocialLinks) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-16 w-full mb-4" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const error = profileError || linksError || socialLinksError;
  if (error) {
    return <div className="text-red-500 p-4">Error loading data: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Editor */}
      <div className="lg:col-span-2 space-y-8">
        {profile && <ProfileForm profile={profile} />}
        {socialLinks && <SocialLinksList socialLinks={socialLinks} />}
        {links && <LinkList links={links} />}
      </div>

      {/* Right Column: Phone Mockup */}
      <div className="hidden lg:block">
        <div className="sticky top-24">
          {profile && links && socialLinks && (
            <PhoneMockup profile={profile} links={links} socialLinks={socialLinks} />
          )}
        </div>
      </div>
    </div>
  );
}
