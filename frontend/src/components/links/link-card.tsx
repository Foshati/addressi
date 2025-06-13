/* eslint-disable @next/next/no-img-element */
"use client";

import { Link } from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import { useAtom } from "jotai";
import { deleteGuestLinkAtom } from "@/store/atoms";
import { toast } from "sonner";
import { linkApi } from "@/lib/api";
import { AxiosError } from "axios";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Icons, iconVariants } from "@/components/ui/icons";
import { LinkOptionsDropdown } from "./link-options-dropdown";
import { LinkCopyButton } from "./link-copy-button";
import { LinkQRCodeDialog } from "./link-qrcode-dialog";
import { DeleteLinkDialog } from "./delete-link-dialog";

interface LinkCardProps {
  link: Link;
}

export const LinkCard = ({ link }: LinkCardProps) => {
  const { user } = useUser();
  const [, deleteGuestLink] = useAtom(deleteGuestLinkAtom);
  const [showFallback, setShowFallback] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setShowFallback(false);
  }, [link.id]);

  const isGuestLink = !link.userId;

  const handleDelete = async () => {
    try {
      if (isGuestLink) {
        deleteGuestLink(link.id);
        toast.success("Link deleted successfully");
      } else {
        await linkApi.deleteLink(link.id);
        toast.success("Link deleted successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["my-links"] });
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to delete link");
      }
    }
  };

  const shortUrl = `${window.location.origin}/${link.slug}`;

  const getFallbackInitial = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      const cleanHostname = hostname.startsWith('www.') ? hostname.substring(4) : hostname;
      return cleanHostname ? cleanHostname.charAt(0).toUpperCase() : 'L';
    } catch (e) {
      console.error("Error parsing URL for favicon fallback:", e);
      return 'L';
    }
  };

  const fallbackInitial = getFallbackInitial(link.url);

  return (
    <div className="flex flex-col space-y-4 rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          {link.favicon && !showFallback ? (
            <img
              src={link.favicon}
              alt={link.title}
              className="h-8 w-8 rounded"
              onError={() => setShowFallback(true)}
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-sm font-semibold">
              {fallbackInitial}
            </div>
          )}
          <div className="flex flex-col">
            <h3 className="font-medium">{link.title}</h3>
            <p className="text-sm text-muted-foreground">{link.url}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <LinkCopyButton url={shortUrl} />
          <LinkQRCodeDialog link={link} />
          {user && <LinkOptionsDropdown link={link} />}
          <DeleteLinkDialog onDelete={handleDelete} />
        </div>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>{shortUrl}</span>
          {link.clicks > 0 && (
            <span className="flex items-center space-x-1">
              <Icons.Eye className={iconVariants({ size: "sm" })} />
              <span>{link.clicks} clicks</span>
            </span>
          )}
        </div>
        {isGuestLink && link.expiresAt && (
          <span className="text-xs text-yellow-500">
            Expires in {new Date(link.expiresAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};
