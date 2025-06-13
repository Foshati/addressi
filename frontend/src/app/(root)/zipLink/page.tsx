import { Suspense } from "react";

import { LinkList } from "@/components/links/link-list";
import { LinkForm } from "@/components/links/link-form";
import { Loader } from "lucide-react";
import { Heading } from "@/components/ui/heading";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen py-10 px-4 sm:px-6 lg:px-8">
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
      <div className="w-full max-w-2xl flex flex-col items-center gap-4">
        <LinkForm />
        <Suspense fallback={<Loader size="4xl" className="my-20" />}>
          <LinkList />
        </Suspense>
      </div>
    </div>
  );
}
