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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LinkCardProps {
  link: Link;
  onLinkSelect: (linkId: string) => void;
  selectedLinkId: string | null;
}

export const LinkCard = ({ link, onLinkSelect, selectedLinkId }: LinkCardProps) => {
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

  // Function to truncate text with ellipsis
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div 
      className={`flex flex-col space-y-3 rounded-lg border p-4 cursor-pointer transition-colors duration-200 w-full ${
        selectedLinkId === link.id ? 'bg-muted' : 'hover:bg-muted/50'
      }`}
      onClick={() => onLinkSelect(link.id)}
    >
      {/* Top section with favicon, title, URL and actions */}
      <div className="flex items-start justify-between gap-3">
        {/* Left section: favicon + content */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Favicon */}
          <div className="flex-shrink-0 mt-1">
            {link.favicon && !showFallback ? (
              <img
                src={link.favicon}
                alt={link.title}
                className="h-6 w-6 rounded"
                onError={() => setShowFallback(true)}
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-semibold">
                {fallbackInitial}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-tight mb-1">
              {truncateText(link.title, 50)}
            </h3>
            <p className="text-xs text-muted-foreground leading-tight">
              {truncateText(link.url, 60)}
            </p>
          </div>
        </div>

        {/* Right section: actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Desktop actions - all icons visible */}
          <div className="hidden lg:flex items-center gap-1">
            <LinkCopyButton url={shortUrl} />
            <LinkQRCodeDialog link={link}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Icons.QrCode className="h-4 w-4" />
              </Button>
            </LinkQRCodeDialog>
            {user && (
              <LinkOptionsDropdown link={link}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Icons.Edit className="h-4 w-4" />
                </Button>
              </LinkOptionsDropdown>
            )}
            <DeleteLinkDialog onDelete={handleDelete}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                <Icons.Trash2 className="h-4 w-4" />
              </Button>
            </DeleteLinkDialog>
          </div>

          {/* Mobile/Tablet actions - only copy icon + dropdown */}
          <div className="lg:hidden flex items-center gap-1">
            <LinkCopyButton url={shortUrl} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <LinkQRCodeDialog link={link}>
                    <Button variant="ghost" className="w-full justify-start h-auto p-2">
                      <Icons.QrCode className="mr-2 h-4 w-4" />
                      <span>QR Code</span>
                    </Button>
                  </LinkQRCodeDialog>
                </DropdownMenuItem>
                {user && (
                  <DropdownMenuItem asChild>
                    <LinkOptionsDropdown link={link}>
                      <Button variant="ghost" className="w-full justify-start h-auto p-2">
                        <Icons.Edit className="mr-2 h-4 w-4" />
                        <span>Edit Link</span>
                      </Button>
                    </LinkOptionsDropdown>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <DeleteLinkDialog onDelete={handleDelete}>
                    <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive h-auto p-2">
                      <Icons.Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete Link</span>
                    </Button>
                  </DeleteLinkDialog>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Bottom section with short URL and stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="truncate font-mono">
            {truncateText(shortUrl, 45)}
          </span>
          {!isGuestLink && (
            <span className="flex items-center gap-1 flex-shrink-0">
              <Icons.Eye className={iconVariants({ size: "sm" })} />
              <span>{link.clicks}</span>
            </span>
          )}
        </div>
        
        {isGuestLink && (
          <div className="flex items-center gap-2 flex-shrink-0 text-yellow-500">
            {link.clicks > -1 && (
              <span className="flex items-center gap-1">
                <Icons.Eye className={iconVariants({ size: "sm" })} />
                <span>{link.clicks}</span>
              </span>
            )}
            {link.expiresAt && (
              <span className="text-xs">
                Expires {new Date(link.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};