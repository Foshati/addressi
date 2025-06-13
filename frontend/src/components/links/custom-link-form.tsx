"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { linkApi, type Link, type UpdateLinkData } from "@/lib/api";
import { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";

import { nanoid } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Icons, iconVariants } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL").min(1, "URL is too short").max(2000, "URL is too long"),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").optional(),
  description: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface CustomLinkFormProps {
  onSuccess?: () => void;
  defaultValues?: Link;
  isEditing?: boolean;
}

export const CustomLinkForm = ({
  onSuccess,
  isEditing = false,
  defaultValues,
}: CustomLinkFormProps) => {
  const [slug, setSlug] = useState("");
  const [isSlugExist, setIsSlugExist] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const debouncedSlug = useDebounce(slug, 500);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    mode: "all",
    defaultValues: {
      url: defaultValues?.url ?? "",
      title: defaultValues?.title ?? "",
      slug: defaultValues?.slug ?? "",
      description: defaultValues?.description ?? "",
    },
  });

  useEffect(() => {
    const checkSlug = async () => {
      if (!debouncedSlug) {
        setIsSlugExist(false);
        form.clearErrors("slug");
        return;
      }

      if (isEditing && defaultValues?.slug === debouncedSlug) {
        setIsSlugExist(false);
        form.clearErrors("slug");
        return;
      }

      try {
        setIsCheckingSlug(true);
        await linkApi.getLinkBySlug(debouncedSlug);
        setIsSlugExist(true);
        form.setError("slug", { message: "Slug already exists" });
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          setIsSlugExist(false);
          form.clearErrors("slug");
        } else {
          if (error instanceof AxiosError && error.response?.data?.message) {
            toast.error(error.response.data.message);
          } else {
            toast.error("Error checking slug");
          }
        }
      } finally {
        setIsCheckingSlug(false);
      }
    };

    checkSlug();
  }, [debouncedSlug, form, isEditing, defaultValues?.slug]);

  const onSubmit = async (values: FormSchema) => {
    if (isSlugExist) {
      return form.setError("slug", { message: "Slug already exists" });
    }

    try {
      setIsLoading(true);
      if (isEditing && defaultValues) {
        const updateData: UpdateLinkData = {};
        if (values.title !== defaultValues.title) updateData.title = values.title;
        if (values.url !== defaultValues.url) updateData.url = values.url;
        if (values.description !== defaultValues.description) updateData.description = values.description;

        await linkApi.updateLink(defaultValues.id, updateData);
        toast.success("Link updated successfully");
      } else {
        const response = await linkApi.createLink({
          title: values.title,
          url: values.url,
          description: values.description,
          customSlug: values.slug
        });
        if (!response) {
          throw new Error("Failed to create link");
        }
        toast.success("Link created successfully");
      }
      onSuccess?.();
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["my-links"] });
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to save link");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col w-full gap-4"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter title"
                  {...field}
                />
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
              <FormLabel>Destination URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://github.com/mehrabmp/cut-it"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isEditing && (
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex w-full items-center justify-between">
                  <div>Short Link (optional)</div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center text-xs py-0 px-0 hover:bg-background h-auto"
                    onClick={() => {
                      const newSlug = nanoid();
                      form.setValue("slug", newSlug);
                      setSlug(newSlug);
                    }}
                  >
                    <Icons.Shuffle
                      className={iconVariants({
                        size: "xs",
                        className: "mr-1",
                      })}
                    />
                    Randomize
                  </Button>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="github"
                      className="pe-8"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setSlug(e.target.value);
                      }}
                    />
                    {isCheckingSlug && (
                      <div className="absolute end-3 top-1/2 -translate-y-1/2 transform text-muted-foreground">
                        <Loader />
                      </div>
                    )}
                    {!isCheckingSlug && !isSlugExist && debouncedSlug && (
                      <div className="absolute end-3 top-1/2 -translate-y-1/2 transform text-green-500">
                        <Icons.Check className={iconVariants({ size: "sm" })} />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Cut It is a free open source tool to generate short links"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={!form.formState.isDirty || isLoading || !form.formState.isValid}
        >
          {isLoading && (
            <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isEditing ? "Save changes" : "Create link"}
        </Button>
      </form>
    </Form>
  );
};
