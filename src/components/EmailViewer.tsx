"use client";

import { useAtom, useSetAtom } from 'jotai';
import { selectedEmailAtom, sessionAtom, updateEmailAtom } from '@/store/atoms';
import { readEmail, Email } from '@/lib/api-email';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function EmailViewer() {
  const [selectedEmail] = useAtom(selectedEmailAtom);
  const [session] = useAtom(sessionAtom);
  const updateEmail = useSetAtom(updateEmailAtom);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const fetchEmailContent = async () => {
      if (selectedEmail && !selectedEmail.mail_body && !selectedEmail.mail_id.toString().startsWith('welcome-') && session?.sid_token) {
        setIsFetching(true);
        try {
          const fullEmail = await readEmail(session.sid_token, selectedEmail.mail_id);
          // Update the specific email in the list, preserving the existing list
          const updatedEmail: Email = {
            ...selectedEmail,
            mail_body: fullEmail.mail_body,
            read: 1, // Mark as read
          };
          updateEmail(updatedEmail);
        } catch (error) {
          console.error("Failed to fetch email content:", error);
        } finally {
          setIsFetching(false);
        }
      }
    };

    fetchEmailContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmail?.mail_id]); // Only re-run when the selected email ID changes

  if (!selectedEmail) {
    return (
      <Card className="h-174 flex items-center justify-center bg-card/50 border-dashed">
        <CardContent className="text-center">
          <h3 className="text-lg font-medium">Select an email</h3>
          <p className="text-sm text-muted-foreground">Click an email from the inbox list to view its content here.</p>
        </CardContent>
      </Card>
    );
  }
  
  const emailBody = isFetching 
    ? "<p>Loading...</p>" 
    : selectedEmail.mail_body || "<p>This email has no content.</p>";

  return (
    <Card className="h-174 flex flex-col">
      <CardHeader>
        <CardTitle className="truncate">{selectedEmail.mail_subject}</CardTitle>
        <CardDescription>From: {selectedEmail.mail_from}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow border-t pt-4 overflow-hidden">
        <iframe
          srcDoc={emailBody}
          className="w-full h-full border-0 bg-background"
          sandbox="allow-same-origin"
          key={selectedEmail.mail_id} // Add key to force re-render
        />
      </CardContent>
    </Card>
  );
}
