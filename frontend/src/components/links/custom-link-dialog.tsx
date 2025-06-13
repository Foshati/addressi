"use client";

import { useState } from "react";
import { type Link } from "@/lib/api";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CustomLinkForm } from "@/components/links/custom-link-form";

interface CustomLinkDialogProps {
  children: React.ReactNode;
  defaultValues?: Link;
  isEditing?: boolean;
}

export const CustomLinkDialog = ({
  children,
  defaultValues,
  isEditing = false,
}: CustomLinkDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Link" : "Create Custom Link"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edit your custom link details below."
              : "Create a custom link with your preferred slug."}
          </DialogDescription>
        </DialogHeader>
        <CustomLinkForm
          onSuccess={() => setOpen(false)}
          defaultValues={defaultValues}
          isEditing={isEditing}
        />
      </DialogContent>
    </Dialog>
  );
};
