import NextImage from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Clapperboard, FileImage } from "lucide-react";

export type GeneratedContent = {
  type: 'image' | 'video';
  url: string;
};

type ContentGalleryProps = {
  content: GeneratedContent[];
};

export function ContentGallery({ content }: ContentGalleryProps) {
  return (
    <section className="animate-fade-in">
      <h2 className="text-3xl font-bold font-headline mb-6 text-center">Your Creations</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {content.map((item, index) => (
          <Card key={index} className="overflow-hidden group transition-all hover:scale-105 hover:shadow-xl shadow-md">
            <CardContent className="p-0 aspect-square relative">
              {item.type === 'image' ? (
                <NextImage src={item.url} alt={`Generated image ${index + 1}`} layout="fill" objectFit="cover" />
              ) : (
                <video src={item.url} controls className="w-full h-full object-cover" />
              )}
              <div className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full backdrop-blur-sm">
                {item.type === 'image' ? <FileImage className="w-4 h-4"/> : <Clapperboard className="w-4 h-4"/>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
