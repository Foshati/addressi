/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAtom, useSetAtom } from 'jotai';
import { sessionAtom, emailsAtom, selectedEmailAtom, statusAtom, autoRefreshAtom, refreshIntervalAtom, captchaModalAtom } from '@/store/atoms';
import { getSession, checkEmail, forgetSession, Email } from '@/lib/api-email';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusIndicator from './StatusIndicator';
import { Copy, RefreshCw, Trash2, Check, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
const CaptchaDialog = dynamic(() => import('./CaptchaDialog'), { ssr: false });

export default function EmailControls() {
  const [session, setSession] = useAtom(sessionAtom);
  const [status, setStatus] = useAtom(statusAtom);
  const [, setEmails] = useAtom(emailsAtom);
  const [autoRefresh, setAutoRefresh] = useAtom(autoRefreshAtom);
  const [refreshInterval, setRefreshInterval] = useAtom(refreshIntervalAtom);
  const [, setCaptchaOpen] = useAtom(captchaModalAtom);
  const [isMounted, setIsMounted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCopyToClipboard = () => {
    if (session?.email_addr) {
      navigator.clipboard.writeText(session.email_addr);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }
  };

  const handleRefreshMail = async () => {
    if (!session?.sid_token) {
      toast.error('No active session. Please generate a new address.');
      return;
    }
    setStatus('LOADING');
    try {
      const data = await checkEmail(session.sid_token);
      setEmails((prevEmails) => {
        const existingIds = new Set(prevEmails.map(e => e.mail_id));
        const newEmails = data.list.filter((e: Email) => !existingIds.has(e.mail_id));
        if (newEmails.length > 0) {
          toast.info(`${newEmails.length} new email(s) arrived.`);
          return [...newEmails, ...prevEmails];
        } else {
          toast.info('No new emails.');
          return prevEmails;
        }
      });
    } catch (error) {
      toast.error('Failed to refresh emails.');
    } finally {
      setStatus('ONLINE');
    }
  };

  const onCaptchaSuccess = async () => {
    setStatus('LOADING');
    try {
      if (session?.sid_token) {
        await forgetSession(session.sid_token);
        toast.info('Previous email address deleted.');
      }

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
      toast.success(`New email address generated: ${newSession.email_addr}`);
    } catch (error) {
      toast.error('Failed to generate new email address.');
    } finally {
      setStatus('ONLINE');
    }
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Email Controls</h3>
          <StatusIndicator status={status} />
        </div>

        <div className="flex items-center space-x-2">
          <Input readOnly value={session?.email_addr || (isMounted ? 'No active email' : '...')} className="flex-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleCopyToClipboard} disabled={!isMounted || !session?.email_addr}>
                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy Email Address</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleRefreshMail} disabled={!isMounted || status === 'LOADING'}>
                  <RefreshCw className={`h-4 w-4 ${status === 'LOADING' ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh Inbox</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" size="icon" onClick={() => setCaptchaOpen(true)} disabled={!isMounted || status === 'LOADING'}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Get a New Address</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" disabled={!isMounted || status === 'LOADING'}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Auto-Refresh Settings</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Auto-Refresh</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              >
                Enable
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Interval</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setRefreshInterval(10000)} disabled={!autoRefresh}>10 seconds</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setRefreshInterval(30000)} disabled={!autoRefresh}>30 seconds</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setRefreshInterval(60000)} disabled={!autoRefresh}>1 minute</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CaptchaDialog onVerifySuccess={onCaptchaSuccess} />
      </div>
    </TooltipProvider>
  );
}
