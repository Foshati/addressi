"use client";

import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { guestLinkExpirationAtom } from "@/store/atoms";
import { LinkCard } from "./link-card";
import { useUser } from "@/hooks/useUser";
import { Icons, iconVariants } from "@/components/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { linkApi, Link } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LinkListProps {
  onLinkSelect: (linkId: string) => void;
  selectedLinkId: string | null;
}

export const LinkList = ({ onLinkSelect, selectedLinkId }: LinkListProps) => {
  const { user, isLoading: isUserLoading, isError: isUserError } = useUser();
  const [guestLinks] = useAtom(guestLinkExpirationAtom);
  const [hasMounted, setHasMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayedUserLinksCount, setDisplayedUserLinksCount] = useState(5);
  const [displayedGuestLinksCount, setDisplayedGuestLinksCount] = useState(5);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const {
    data: userLinks = [],
    isLoading: isLoadingUserLinks,
    isError: isUserLinksError,
  } = useQuery<Link[]>({
    queryKey: ["my-links", user?.id],
    queryFn: linkApi.getMyLinks,
    enabled: !!user && !isUserLoading,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const allLinks = [...userLinks, ...guestLinks];

  const filteredLinks = allLinks.filter((link) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      link.title.toLowerCase().includes(lowerCaseSearchTerm) ||
      link.url.toLowerCase().includes(lowerCaseSearchTerm) ||
      link.slug.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const hasAnyLinks = allLinks.length > 0;
  const hasFilteredLinks = filteredLinks.length > 0;

  const filteredUserLinks = filteredLinks.filter((link) => link.userId);
  const filteredGuestLinks = filteredLinks.filter((link) => !link.userId);

  if (isUserLoading || isLoadingUserLinks) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Icons.Loader
          className={iconVariants({ size: "lg", className: "animate-spin" })}
        />
      </div>
    );
  }

  if (isUserLinksError) {
    console.error(
      "Frontend: LinkList - Error fetching links: User links error"
    );
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load your links. Please try again.
      </div>
    );
  }

  if (isUserError && !user) {
    console.warn("Frontend: LinkList - User not loaded (expected for guest users)");
    // Do not return an error component here, continue to render for guest links
  }

  return (
    <div className="space-y-4 w-full">
      {/* Search Input */}
      <div className="w-full">
        <Input
          type="text"
          placeholder="Search links..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {hasMounted && hasFilteredLinks ? (
        <div className="space-y-6">
          {/* User Links Section */}
          {filteredUserLinks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Your Links</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {filteredUserLinks
                  .slice(0, displayedUserLinksCount)
                  .map((link) => (
                    <LinkCard
                      key={link.id}
                      link={link}
                      onLinkSelect={onLinkSelect}
                      selectedLinkId={selectedLinkId}
                    />
                  ))}
              </div>
              {filteredUserLinks.length > displayedUserLinksCount && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDisplayedUserLinksCount((prevCount) => prevCount + 5)
                    }
                  >
                    Load More Your Links
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Guest Links Section */}
          {filteredGuestLinks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Guest Links</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {filteredGuestLinks
                  .slice(0, displayedGuestLinksCount)
                  .map((link) => (
                    <LinkCard
                      key={link.id}
                      link={link}
                      onLinkSelect={onLinkSelect}
                      selectedLinkId={selectedLinkId}
                    />
                  ))}
              </div>
              {filteredGuestLinks.length > displayedGuestLinksCount && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDisplayedGuestLinksCount((prevCount) => prevCount + 5)
                    }
                  >
                    Load More Guest Links
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : hasAnyLinks && !hasFilteredLinks ? (
        <div className="text-center py-8 text-muted-foreground">
          No links match your search.
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No links found. Create your first link above!
        </div>
      )}
    </div>
  );
};
