import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        const output = await replicate.run(
            "sundai-club/snow_bunny:166808a65c69a9258c4fe45a4ffd6eeb1579257fadd3c57d388fff41ae529c6a",
            {
                input: {
                    prompt: prompt,
                    num_inference_steps: 8,
                    model: "schnell"
                }
            }
        );

        const img_url = String(output);

        // Save the image through Python backend
        const saveResponse = await fetch('https://sundai-backend-176750765325.us-east4.run.app/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                image_url: img_url
            })
        });

        if (!saveResponse.ok) {
            throw new Error('Failed to save image');
        }

        return NextResponse.json({ imageUrl: img_url });
    }
    catch (error) {
        console.error('Error generating image', error);
        return NextResponse.json(
            { error: 'Failed to generate image' },
            { status: 500 }
        );
    }
}
