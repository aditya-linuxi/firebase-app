'use server';
/**
 * @fileOverview Generates an image based on user input (text or image).
 *
 * - generateImage - A function that generates an image based on the input.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  textDescription: z.string().optional().describe('A text description of the desired image.'),
  imageDataUri: z
    .string()
    .optional()
    .describe(
      "An image to use as a starting point, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('The generated image as a data URI.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImagePrompt = ai.definePrompt({
  name: 'generateImagePrompt',
  input: {schema: GenerateImageInputSchema},
  output: {schema: GenerateImageOutputSchema},
  prompt: `Generate an image based on the following input.\n\n{{~#if textDescription}}Text Description: {{{textDescription}}}\n{{/if}}\n\n{{~#if imageDataUri}}Image: {{media url=imageDataUri}}\n{{/if}}\n`,
});

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async input => {
    const promptInput: {textDescription?: string; imageDataUri?: string} = {};
    if (input.textDescription) {
      promptInput.textDescription = input.textDescription;
    }
    if (input.imageDataUri) {
      promptInput.imageDataUri = input.imageDataUri;
    }

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [promptInput.textDescription ? {text: promptInput.textDescription} : null, promptInput.imageDataUri ? {media: {url: promptInput.imageDataUri}} : null].filter(Boolean) as any,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {imageUrl: media!.url};
  }
);
