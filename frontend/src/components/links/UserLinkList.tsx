"use client";

import { useQuery } from "@tanstack/react-query";
import { linkApi } from "@/lib/api";
import { LinkCard } from "./link-card";
import { useUser } from "@/hooks/useUser";
import { Icons, iconVariants } from "@/components/ui/icons";

export const UserLinkList = () => {
  const { user, isLoading: isUserLoading, isError: isUserError } = useUser();

  const { data: userLinks = [], error } = useQuery({
    queryKey: ["my-links", user?.id],
    queryFn: linkApi.getMyLinks,
    enabled: !!user && !isUserLoading, // Only fetch if user is loaded and authenticated
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100px]">
        <Icons.Loader className={iconVariants({ size: "lg", className: "animate-spin" })} />
      </div>
    );
  }

  if (isUserError || error) {
    console.error("Frontend: UserLinkList - Error fetching user links:", isUserError ? "User not loaded" : error);
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load your links. Please try again.
      </div>
    );
  }

  if (!user || userLinks.length === 0) {
    return null; // Don't show anything if no user or no user links, LinkList will handle general empty state
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Your Links</h2>
      <div className="grid gap-4">
        {userLinks.map((link) => (
          <LinkCard key={link.id} link={link} />
        ))}
      </div>
    </div>
  );
}; 