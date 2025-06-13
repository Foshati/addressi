"use client";

import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { guestLinkExpirationAtom } from "@/store/atoms";
import { LinkCard } from "./link-card";
import { useUser } from "@/hooks/useUser";
import { UserLinkList } from "./UserLinkList";
import { Icons, iconVariants } from "@/components/ui/icons";

export const LinkList = () => {
  const { user, isLoading: isUserLoading } = useUser();
  const [guestLinks] = useAtom(guestLinkExpirationAtom);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Determine if there are any links (user or guest) to display
  const hasUserLinksLoaded = !isUserLoading && user;
  const hasGuestLinks = guestLinks.length > 0 && hasMounted;
  
  // Render loading state for user links if user is loading
  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Icons.Loader className={iconVariants({ size: "lg", className: "animate-spin" })} />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {hasUserLinksLoaded && <UserLinkList />}

      {hasMounted && guestLinks.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mt-4">Guest Links</h2>
          <div className="grid gap-4">
            {guestLinks.map((link) => (
              <LinkCard key={link.id} link={link} />
            ))}
          </div>
        </>
      )}

      {!hasUserLinksLoaded && !hasGuestLinks && (
        <div className="text-center py-8 text-muted-foreground">
          No links found. Create your first link above!
        </div>
      )}
    </div>
  );
};
