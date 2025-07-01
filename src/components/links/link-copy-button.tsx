"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Icons, iconVariants } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

interface LinkCopyButtonProps {
  url: string;
  children?: React.ReactNode;
}

export const LinkCopyButton = ({ url, children }: LinkCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={copyToClipboard}
    >
      {children || (
        isCopied ? (
          <Icons.Clipboard className={iconVariants({ size: "sm" })} />
        ) : (
          <Icons.Copy className={iconVariants({ size: "sm" })} />
        )
      )}
      <span className="sr-only">Copy link</span>
    </Button>
  );
};
