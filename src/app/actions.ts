"use server";

import { generateImage } from "@/ai/flows/generate-image-from-input";
import { generateVideoFromInput } from "@/ai/flows/generate-video-from-input";
import { z } from "zod";

const fileToDataUri = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${file.type};base64,${base64}`;
}

const actionSchema = z.object({
  textDescription: z.string().optional(),
  imageFile: z.instanceof(File).optional(),
});

export async function generateImageAction(formData: FormData) {
  try {
    const parsedData = actionSchema.safeParse({
      textDescription: formData.get("textDescription") || undefined,
      imageFile: formData.get("imageFile") instanceof File ? formData.get("imageFile") : undefined,
    });
    
    if (!parsedData.success) {
      return { success: false, message: "Invalid input data." };
    }
    
    const { textDescription, imageFile } = parsedData.data;

    if (!textDescription && !imageFile) {
      return { success: false, message: "Please provide a text description or an image." };
    }

    const imageDataUri = imageFile ? await fileToDataUri(imageFile) : undefined;
    
    const result = await generateImage({ textDescription, imageDataUri });

    return { success: true, message: "Image generated", data: { url: result.imageUrl } };
  } catch (error) {
    console.error("generateImageAction Error:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred during image generation.";
    return { success: false, message };
  }
}

export async function generateVideoAction(formData: FormData) {
  try {
     const parsedData = actionSchema.safeParse({
      textDescription: formData.get("textDescription") || undefined,
      imageFile: formData.get("imageFile") instanceof File ? formData.get("imageFile") : undefined,
    });
    
    if (!parsedData.success) {
      return { success: false, message: "Invalid input data." };
    }

    const { textDescription, imageFile } = parsedData.data;

    if (!textDescription && !imageFile) {
        return { success: false, message: "Please provide a text description or an image." };
    }
    
    const imageUri = imageFile ? await fileToDataUri(imageFile) : undefined;

    const result = await generateVideoFromInput({ textDescription, imageUri });

    return { success: true, message: "Video generated", data: { url: result.videoUri } };
  } catch (error) {
    console.error("generateVideoAction Error:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred during video generation.";
    return { success: false, message };
  }
}
