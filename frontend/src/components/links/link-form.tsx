"use client";

import { useState } from "react";
// import { useRouter } from "next/navigation"; // Removed as no longer used
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { linkApi } from "@/lib/api";
import { AxiosError } from "axios";
import { useUser } from "@/hooks/useUser";
import { useAtom } from "jotai";
import { createGuestLinkAtom } from "@/store/atoms";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Icons, iconVariants } from "@/components/ui/icons";
import { CustomLinkDialog } from "./custom-link-dialog";

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL").min(1, "URL is too short").max(2000, "URL is too long"),
});

type FormSchema = z.infer<typeof formSchema>;

interface LinkFormProps {
  onSuccess?: () => void;
}

export const LinkForm = ({ onSuccess }: LinkFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const [, createGuestLink] = useAtom(createGuestLinkAtom);
  const queryClient = useQueryClient();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    mode: "all",
    defaultValues: {
      url: "",
    },
  });

  const onSubmit = async (values: FormSchema) => {
    try {
      setIsLoading(true);
      const linkData = {
        url: values.url,
        title: values.url.substring(0, 100), // Use URL as title
        isActive: true,
        clicks: 0,
        isCustom: false
      };

      if (user) {
        // If user is logged in, create link through API
        const response = await linkApi.createLink(linkData);
        if (!response) {
          throw new Error("Failed to create link");
        }
      } else {
        // For guest users, create link using Jotai atom
        createGuestLink(linkData);
      }

      toast.success("Link created successfully");
      form.reset();
      onSuccess?.();
      if (user) {
        queryClient.invalidateQueries({ queryKey: ["my-links"] });
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          toast.error("Please sign in to create links");
          // router.push("/login"); // Removed as router is no longer used
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Failed to create link");
        }
      } else {
        toast.error("Failed to create link");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="relative flex items-center w-full space-x-2">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem className="flex-grow mb-0">
                <FormControl>
                  <Input
                    placeholder="Enter the link here"
                    {...field}
                    className="flex-grow py-2 px-4 h-14"
                  />
                </FormControl>
                <FormMessage className="absolute -bottom-5 left-0" />
              </FormItem>
            )}
          />
          <Button type="submit" size="icon" className="h-14 w-14" disabled={isLoading || !form.formState.isValid}>
            {isLoading ? (
              <Icons.Loader className={iconVariants({ size: "lg", className: "animate-spin" })} />
            ) : (
              <Icons.Scissors className={iconVariants({ size: "lg" })} />
            )}
            <span className="sr-only">Shorten link</span>
          </Button>
          {user && (
            <CustomLinkDialog>
              <Button type="button" size="icon" variant="outline" className="h-14 w-14" disabled={isLoading}>
                <Icons.Settings2 className={iconVariants({ size: "lg" })} />
                <span className="sr-only">Create custom link</span>
              </Button>
            </CustomLinkDialog>
          )}
        </form>
      </Form>
      {!user && (
        <p className="text-sm text-muted-foreground text-center">
          Maximize your link&apos;s lifespan beyond 24 hours by signing in and accessing exclusive editing features!
        </p>
      )}
    </div>
  );
};
