"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/header";
import { ImageGenerator } from "@/components/image-generator";
import { VideoGenerator } from "@/components/video-generator";
import { ContentGallery, type GeneratedContent } from "@/components/content-gallery";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);

  const handleGenerationComplete = (content: GeneratedContent) => {
    setGeneratedContent((prev) => [content, ...prev]);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">
            Create with AI
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Bring your ideas to life. Generate stunning images and captivating videos from text or your own images.
          </p>
        </div>
        
        <Tabs defaultValue="image" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 bg-primary/10">
            <TabsTrigger value="image">Image Generation</TabsTrigger>
            <TabsTrigger value="video">Video Generation</TabsTrigger>
          </TabsList>
          <TabsContent value="image">
            <ImageGenerator onGenerationComplete={handleGenerationComplete} />
          </TabsContent>
          <TabsContent value="video">
            <VideoGenerator onGenerationComplete={handleGenerationComplete} />
          </TabsContent>
        </Tabs>
        
        {generatedContent.length > 0 && (
          <>
            <Separator className="my-12 bg-border/50" />
            <ContentGallery content={generatedContent} />
          </>
        )}
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} TrendSpotter. All rights reserved.</p>
      </footer>
    </div>
  );
}
