"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileImage, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import NextImage from "next/image";
import { useToast } from "@/hooks/use-toast";
import { generateImageAction } from "@/app/actions";
import { type GeneratedContent } from "./content-gallery";

const formSchema = z.object({
  textDescription: z.string().min(1, 'Please enter a description.').optional().or(z.literal('')),
  imageFile: z.custom<File>(f => f instanceof File, "Please upload an image.").optional(),
}).refine(data => !!data.textDescription || !!data.imageFile, {
  message: "Either a text description or an image upload is required.",
  path: ["textDescription"],
});

type ImageGeneratorProps = {
  onGenerationComplete: (content: GeneratedContent) => void;
};

export function ImageGenerator({ onGenerationComplete }: ImageGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { textDescription: "" },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('imageFile', file, { shouldValidate: true });
      setImagePreview(URL.createObjectURL(file));
    } else {
      form.setValue('imageFile', undefined, { shouldValidate: true });
      setImagePreview(null);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    const formData = new FormData();
    if (values.textDescription) formData.append('textDescription', values.textDescription);
    if (values.imageFile) formData.append('imageFile', values.imageFile);
    
    try {
      const result = await generateImageAction(formData);
      if (result.success && result.data?.url) {
        onGenerationComplete({ type: 'image', url: result.data.url });
        toast({ title: "Success!", description: "Your image has been generated." });
        form.reset({ textDescription: '' });
        URL.revokeObjectURL(imagePreview!);
        setImagePreview(null);
      } else {
        toast({ variant: 'destructive', title: "Generation Failed", description: result.message });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: "An Error Occurred", description: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full border-primary/20 shadow-lg mt-6 animate-fade-in">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Image Studio</CardTitle>
            <CardDescription>Create a unique image from a text prompt or another image.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="textDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text Prompt</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., A majestic lion with a crown of stars, photorealistic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="imageFile"
              render={() => (
                <FormItem>
                  <FormLabel>Base Image</FormLabel>
                  <FormControl>
                    <div className="relative flex justify-center w-full h-48 px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-border hover:border-primary/50 transition-colors">
                      <div className="space-y-1 text-center">
                         {imagePreview ? (
                           <NextImage src={imagePreview} alt="Image preview" width={120} height={120} className="mx-auto object-contain h-28"/>
                         ) : (
                           <FileImage className="w-12 h-12 mx-auto text-muted-foreground" />
                         )}
                        <div className="flex justify-center text-sm text-muted-foreground">
                          <label htmlFor="image-file-upload" className="relative font-medium rounded-md cursor-pointer text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-ring">
                            <span>Upload a file</span>
                            <Input id="image-file-upload" name="imageFile" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {isLoading ? "Generating..." : "Generate Image"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
