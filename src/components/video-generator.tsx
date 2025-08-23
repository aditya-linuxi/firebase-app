"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clapperboard, FileImage, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import NextImage from "next/image";
import { useToast } from "@/hooks/use-toast";
import { generateVideoAction } from "@/app/actions";
import { type GeneratedContent } from "./content-gallery";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  textDescription: z.string().min(1, 'Please enter a description.').optional().or(z.literal('')),
  imageFile: z.custom<File>(f => f instanceof File, "Please upload an image.").optional(),
}).refine(data => !!data.textDescription || !!data.imageFile, {
  message: "Either a text description or an image upload is required.",
  path: ["textDescription"],
});

type VideoGeneratorProps = {
  onGenerationComplete: (content: GeneratedContent) => void;
};

export function VideoGenerator({ onGenerationComplete }: VideoGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { textDescription: "" },
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setProgress(0);
      timer = setInterval(() => {
        setProgress(oldProgress => {
          if (oldProgress >= 95) {
            clearInterval(timer);
            return 95;
          }
          return oldProgress + 5;
        });
      }, 1000);
    }
    return () => {
      clearInterval(timer);
    };
  }, [isLoading]);

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
      const result = await generateVideoAction(formData);
      setProgress(100);
      if (result.success && result.data?.url) {
        onGenerationComplete({ type: 'video', url: result.data.url });
        toast({ title: "Success!", description: "Your video is ready." });
        setTimeout(() => {
          form.reset({ textDescription: '' });
          URL.revokeObjectURL(imagePreview!);
          setImagePreview(null);
          setIsLoading(false);
        }, 1000);
      } else {
        toast({ variant: 'destructive', title: "Generation Failed", description: result.message });
        setIsLoading(false);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: "An Error Occurred", description: "Something went wrong. Please try again." });
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full border-primary/20 shadow-lg mt-6 animate-fade-in">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Video Studio</CardTitle>
            <CardDescription>Generate a captivating video from a text prompt or a base image.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="textDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text Prompt</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., An astronaut floating in space, cinematic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
            </div>
            
            <FormField control={form.control} name="imageFile" render={() => (
                <FormItem>
                  <FormLabel>Base Image</FormLabel>
                  <FormControl>
                    <div className="relative flex justify-center w-full h-48 px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-border hover:border-primary/50 transition-colors">
                      <div className="space-y-1 text-center">
                         {imagePreview ? (
                           <NextImage src={imagePreview} alt="Image preview" width={120} height={120} className="mx-auto object-contain h-28"/>
                         ) : (<FileImage className="w-12 h-12 mx-auto text-muted-foreground" />)}
                        <div className="flex justify-center text-sm text-muted-foreground">
                          <label htmlFor="video-file-upload" className="relative font-medium rounded-md cursor-pointer text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-ring">
                            <span>Upload a file</span>
                            <Input id="video-file-upload" name="imageFile" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {isLoading && (
                <div className="space-y-2 pt-4">
                  <p className="text-sm text-muted-foreground text-center animate-pulse">Video generation can take a few minutes. Please be patient.</p>
                  <Progress value={progress} className="w-full" />
                </div>
              )}
          </CardContent>
          <CardFooter>
            <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clapperboard className="mr-2 h-4 w-4" />}
              {isLoading ? "Generating..." : "Generate Video"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
