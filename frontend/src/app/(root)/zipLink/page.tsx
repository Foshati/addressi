"use client";
import { Suspense, useState } from "react";

import { LinkList } from "@/components/links/link-list";
import { LinkForm } from "@/components/links/link-form";
import { Loader } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkAnalyticsCard } from "@/components/links/link-analytics-card";

export default function Home() {
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  const handleLinkSelect = (linkId: string) => {
    setSelectedLinkId(linkId);
  };

  return (
    <div className="flex flex-col items-center min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Shorten a New Link</CardTitle>
            </CardHeader>
            <CardContent>
              <LinkForm />
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              {/* Removed CardTitle as LinkList component already handles "Your Links" heading */}
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Loader size="4xl" className="my-20" />}>
                <LinkList
                  onLinkSelect={handleLinkSelect}
                  selectedLinkId={selectedLinkId}
                />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <LinkAnalyticsCard linkId={selectedLinkId} />
        </div>
      </div>
    </div>
  );
}
