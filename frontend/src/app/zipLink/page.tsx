import { Suspense } from "react";

import { LinkList } from "@/components/links/link-list";
import { LinkForm } from "@/components/links/link-form";
import { CustomLink } from "@/components/links/custom-link";
import { Loader } from "lucide-react";
import { CustomLinkButton } from "@/components/links/custom-link-button";
import { Heading } from "@/components/ui/heading";

export default function ظ() {
  return (
    <div className="flex flex-col items-center">
      <div className="my-10 space-y-2 text-center">
        <Heading variant="h1" className="text-3xl sm:text-4xl" isFirstBlock>
          Free URL Shortener
        </Heading>
        <Heading
          variant="h2"
          className="text-xl sm:text-2xl text-muted-foreground"
        >
          Cut It is a free open source tool to generate short links
        </Heading>
      </div>
      <div className="flex items-center w-full max-w-md flex-col gap-4">
        <LinkForm
          renderCustomLink={
            <Suspense fallback={<CustomLinkButton disabled />}>
              <CustomLink />
            </Suspense>
          }
        />
        <Suspense fallback={<Loader size="4xl" className="my-20" />}>
          <LinkList />
        </Suspense>
      </div>
    </div>
  );
}
