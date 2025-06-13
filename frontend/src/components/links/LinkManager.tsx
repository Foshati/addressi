"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useUser } from '@/hooks/useUser';
import { LinkList } from './link-list';
import { CustomLinkDialog } from './custom-link-dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

export const LinkManager = () => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-semibold mb-2">Welcome to Link Manager</h2>
        <p className="text-muted-foreground mb-4">
          Please sign in to manage your links
        </p>
        <button
          onClick={() => router.push('/auth/signin')}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Link Manager</h1>
        <CustomLinkDialog>
          <Button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <Icons.Link className="mr-2 h-4 w-4" />
            Create New Link
          </Button>
        </CustomLinkDialog>
      </div>

      <LinkList />
    </div>
  );
}; 