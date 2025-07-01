'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { socialLinkSchema, SocialLink, createSocialLink, updateSocialLink } from '@/lib/api-treeLink';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface SocialLinkFormProps {
  socialLink?: SocialLink;
  onSuccess: () => void;
}

type SocialLinkFormData = z.infer<typeof socialLinkSchema>;

export default function SocialLinkForm({ socialLink, onSuccess }: SocialLinkFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<SocialLinkFormData>({
    resolver: zodResolver(socialLinkSchema),
    defaultValues: {
      platform: socialLink?.platform || '',
      url: socialLink?.url || '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: SocialLinkFormData) => {
      if (socialLink) {
        return updateSocialLink(socialLink.id, data);
      }
      return createSocialLink(data);
    },
    onSuccess: () => {
      toast.success(`Social link ${socialLink ? 'updated' : 'created'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['socialLinks'] });
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const onSubmit = (data: SocialLinkFormData) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="platform"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Platform</FormLabel>
              <FormControl>
                <Input placeholder="e.g., YouTube, Twitter" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://youtube.com/your-channel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </Form>
  );
}
