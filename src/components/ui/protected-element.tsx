"use client";

import { type Session } from "next-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProtectedElementProps {
  session: Session | null | undefined;
  tooltipMessage: string;
  renderElement: (disabled: boolean) => React.ReactNode;
}

export const ProtectedElement = ({
  session,
  tooltipMessage,
  renderElement,
}: ProtectedElementProps) => {
  const isDisabled = !session;

  if (isDisabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {renderElement(true)}
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <>{renderElement(false)}</>;
}; 