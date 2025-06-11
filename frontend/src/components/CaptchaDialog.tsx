"use client";

import { useAtom } from 'jotai';
import { captchaModalAtom } from '@/store/atoms';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from 'react';
import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from 'react-simple-captcha';
import { toast } from 'sonner';

interface CaptchaDialogProps {
  onVerifySuccess: () => void;
}

export default function CaptchaDialog({ onVerifySuccess }: CaptchaDialogProps) {
  const [isOpen, setIsOpen] = useAtom(captchaModalAtom);
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => loadCaptchaEnginge(6), 150);
    }
  }, [isOpen]);

  const handleVerify = () => {
    if (validateCaptcha(userInput)) {
      toast.success('Captcha verified!');
      onVerifySuccess();
      setIsOpen(false);
      setUserInput('');
    } else {
      toast.error('Captcha does not match. Please try again.');
      loadCaptchaEnginge(6); // Keep this for immediate feedback
      setUserInput('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Please verify you are human</DialogTitle>
          <DialogDescription>
            Enter the text from the image to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <LoadCanvasTemplate />
        </div>
        <Input
          placeholder="Enter captcha..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
        />
        <Button onClick={handleVerify} className="mt-4">Verify</Button>
      </DialogContent>
    </Dialog>
  );
}
