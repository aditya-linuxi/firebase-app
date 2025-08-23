'use server';

/**
 * @fileOverview Generates a video from either a text description or an image input.
 *
 * - generateVideoFromInput - A function that generates a video based on text or image input.
 * - GenerateVideoInput - The input type for the generateVideoFromInput function.
 * - GenerateVideoOutput - The return type for the generateVideoFromInput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import * as fs from 'fs';
import {Readable } from 'stream';
import { MediaPart } from 'genkit';

const GenerateVideoInputSchema = z.object({
  textDescription: z.string().optional().describe('Text description to generate the video from.'),
  imageUri: z.string().optional().describe(
    'Image data URI (base64 encoded) to generate the video from.  Must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
  ),
});

export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  videoUri: z.string().describe('The generated video as a data URI (video/mp4;base64).'),
});

export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

export async function generateVideoFromInput(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  return generateVideoFlow(input);
}

const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async input => {
    let operation;
    if (input.textDescription) {
      const result = await ai.generate({
        model: 'googleai/veo-3.0-generate-preview',
        prompt: input.textDescription,
      });
      operation = result.operation;
    } else if (input.imageUri) {
      const result = await ai.generate({
        model: 'googleai/veo-3.0-generate-preview',
        prompt: [
          {
            text: 'make the subject in the photo move',
          },
          {
            media: {
              contentType: input.imageUri.substring(5, input.imageUri.indexOf(';')),
              url: input.imageUri,
            },
          },
        ],
      });
      operation = result.operation;
    } else {
      throw new Error('Either textDescription or imageUri must be provided.');
    }

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes.
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      // Sleep for 5 seconds before checking again.
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      throw new Error('failed to generate video: ' + operation.error.message);
    }

    const video = operation.output?.message?.content.find(p => !!p.media);
    if (!video) {
      throw new Error('Failed to find the generated video');
    }

    // Temporary workaround since downloading videos doesn't work in the server environment.
    // Return the media URL to be downloaded client-side.
    return {videoUri: video.media!.url};
  }
);
