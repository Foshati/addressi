"use client";

import { useState } from "react";
import { Link } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icons, iconVariants } from "@/components/ui/icons";
import { QRCodeSVG } from "qrcode.react";

interface LinkQRCodeDialogProps {
  link: Link;
  children?: React.ReactNode;
}

export const LinkQRCodeDialog = ({ link, children }: LinkQRCodeDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const shortUrl = `${window.location.origin}/${link.slug}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Icons.QrCode className={iconVariants({ size: "sm" })} />
            <span className="sr-only">Show QR code</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 p-4">
          <QRCodeSVG value={shortUrl} size={200} />
          <p className="text-sm text-muted-foreground">{shortUrl}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
