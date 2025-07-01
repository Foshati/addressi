'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createLink,
  updateLink,
  Link as LinkTreeLink,
  linkSchema as formSchema,
} from '@/lib/api-treeLink';
import { toast } from 'sonner';
import { SketchPicker } from 'react-color';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Animation options
const animationOptions = ['none', 'pulse', 'bounce', 'shake'];

interface LinkFormProps {
  link?: LinkTreeLink;
  onClose: () => void;
}

const LinkForm: React.FC<LinkFormProps> = ({ link, onClose }) => {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: link?.title || '',
      url: link?.url || '',
      buttonColor: link?.buttonColor || '#000000',
      borderRadius: link?.borderRadius || 8,
      animation: link?.animation || 'none',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) =>
      link ? updateLink(link.id, values) : createLink(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      toast.success(link ? 'Link updated successfully!' : 'Link created successfully!');
      onClose();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error('Error', { description: error.message });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome Link" {...field} />
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
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Color Picker */}
        <FormField
          control={form.control}
          name="buttonColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Button Color</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <div className="w-6 h-6 rounded-full mr-2 border" style={{ backgroundColor: field.value }}></div>
                    {field.value}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <SketchPicker
                    color={field.value}
                    onChangeComplete={(color) => field.onChange(color.hex)}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Border Radius Slider */}
        <FormField
          control={form.control}
          name="borderRadius"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Border Radius: {field.value}px</FormLabel>
              <FormControl>
                <Slider
                  min={0}
                  max={50}
                  step={1}
                  defaultValue={[field.value || 8]}
                  onValueChange={(vals) => field.onChange(vals[0])}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Animation Selector */}
        <FormField
          control={form.control}
          name="animation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Animation</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an animation" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {animationOptions.map((anim) => (
                    <SelectItem key={anim} value={anim}>
                      {anim.charAt(0).toUpperCase() + anim.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  );
};

export default LinkForm;
