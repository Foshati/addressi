"use client";

import { useState, useEffect, Suspense } from 'react';
import { useAtom } from 'jotai';
import { selectedEmailAtom, searchQueryAtom, filteredEmailsAtom } from '@/store/atoms';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Email } from '@/lib/api-email';
import { cn } from '@/lib/utils';

function EmailListContent() {
  const [filteredEmails] = useAtom(filteredEmailsAtom);
  const [selectedEmail, setSelectedEmail] = useAtom(selectedEmailAtom);

  if (filteredEmails.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Your inbox is empty.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredEmails.map((email: Email) => (
        <div
          key={email.mail_id}
          onClick={() => setSelectedEmail(email)}
          className={cn(
            'p-3 border rounded-lg cursor-pointer transition-colors',
            selectedEmail?.mail_id === email.mail_id
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted/50'
          )}
        >
          <div className="flex justify-between items-start">
            <h3 className="font-semibold truncate flex-1 pr-2 text-sm">{email.mail_from}</h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(email.mail_timestamp * 1000), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm truncate">{email.mail_subject}</p>
        </div>
      ))}
    </div>
  );
}

export default function EmailList() {
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Inbox</CardTitle>
        <Input
          placeholder="Search emails..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-2"
        />
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4">
          {isMounted ? (
            <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
              <EmailListContent />
            </Suspense>
          ) : (
            <div className="text-center py-10">Loading...</div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
