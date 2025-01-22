import { NextResponse } from "next/server";
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.GITHUB_TOKEN,
    baseURL: "https://models.inference.ai.azure.com"
});

const SYSTEM_PROMPT = `
You are a comic story writer. Create a 3 panel comic about a bunny's adventure, where each panel provides
an image generation prompt that includes 'SNOWBUNNY' and ends with 'cartoon style', and a caption referring to
the bunny as 'Snow'. Return the comic as a JSON with this format:
{
    "comics": [
        {
            "prompt": "Image generation prompt here",
            "caption": "Caption text here"
        }
    ]
}
`

export async function POST(request: Request) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: SYSTEM_PROMPT
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: { type: "json_object" }
        });

        const prompts = completion.choices[0].message.content as string;
        if (!prompts) {
            return NextResponse.json({ error: 'No prompts generated' }, { status: 400 });
        }
        return NextResponse.json({ result: JSON.parse(prompts) });

    } catch (error) {
        console.error('Error generating story:', error);
        return NextResponse.json(
            { error: 'Failed to generate story' },
            { status: 500 }
        );
    }
}
