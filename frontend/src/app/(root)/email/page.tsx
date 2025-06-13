"use client";

import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { sessionAtom, statusAtom, emailsAtom, autoRefreshAtom, refreshIntervalAtom } from '@/store/atoms';
import { getSession, checkEmail, Email } from '@/lib/api-email';
import { toast } from 'sonner';

import EmailControls from '@/components/EmailControls';
import EmailList from '@/components/EmailList';
import EmailViewer from "@/components/EmailViewer";

export default function Home() {
  const [session, setSession] = useAtom(sessionAtom);
  const [, setStatus] = useAtom(statusAtom);
  const [, setEmails] = useAtom(emailsAtom);
  const [autoRefresh] = useAtom(autoRefreshAtom);
  const [refreshInterval] = useAtom(refreshIntervalAtom);

  // Initial session fetch
  useEffect(() => {
    const initializeSession = async () => {
      // If there's no session in localStorage, get a new one.
      if (!session) {
        setStatus('LOADING');
        try {
          const newSession = await getSession();
          setSession(newSession);

          const welcomeEmail: Email = {
            mail_id: `welcome-${Date.now()}`,
            mail_from: 'foshati',
            mail_subject: 'Welcome to foshati.com',
            mail_excerpt: 'Thank you for using our service!',
            mail_timestamp: Math.floor(Date.now() / 1000),
            read: 1,
            mail_date: new Date().toISOString(),
            mail_size: '1',
            mail_body: `
              <div style="font-family: sans-serif; padding: 20px;">
                <h1>Welcome to foshati.com!</h1>
                <p>Your new temporary email address is ready.</p>
                <p><b>Email:</b> ${newSession.email_addr}</p>
                <p>Thank you for choosing our service.</p>
              </div>
            `
          };
          setEmails([welcomeEmail]);
          setStatus('ONLINE');
        } catch (error) {
          console.error('Failed to initialize session:', error);
          setStatus('ERROR');
          toast.error('Could not connect to the server.');
        }
      } else {
        // If a session exists, just set status to online.
        setStatus('ONLINE');
      }
    };

    initializeSession();
    // We only want this to run once on initial load, and session is now in storage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh logic
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const fetchEmails = async () => {
      if (session?.sid_token) {
        try {
          const data = await checkEmail(session.sid_token);
          setEmails((prevEmails) => {
            const currentEmails = Array.isArray(prevEmails) ? prevEmails : [];
            const existingIds = new Set(currentEmails.map(e => e.mail_id));
            const uniqueNewEmails = data.list.filter((e: Email) => !existingIds.has(e.mail_id));

            if (uniqueNewEmails.length > 0) {
              return [...uniqueNewEmails, ...currentEmails];
            }
            return currentEmails;
          });
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }
    };

    if (autoRefresh && session?.sid_token) {
      // The first fetch will happen after the interval.
      // This prevents a race condition when a new email is created.
      intervalId = setInterval(fetchEmails, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, session, setEmails]);

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-full">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <EmailControls />
          <EmailList />
        </div>
        <div className="lg:col-span-2 h-full">
          <EmailViewer />
        </div>
      </div>
    </div>
  );
}
