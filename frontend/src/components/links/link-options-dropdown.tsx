"use client";

import { type Link } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Icons, iconVariants } from "@/components/ui/icons";
import { CustomLinkDialog } from "./custom-link-dialog";

type LinkOptionsDropdownProps = {
  link: Link;
};

export const LinkOptionsDropdown = ({ link }: LinkOptionsDropdownProps) => {
  return (
    <CustomLinkDialog defaultValues={link} isEditing>
      <Button
        variant="ghost"
        className="h-8 w-8 p-0"
      >
        <Icons.Edit
          className={iconVariants({ size: "sm" })}
          aria-label="Edit link"
        />
      </Button>
    </CustomLinkDialog>
  );
};
