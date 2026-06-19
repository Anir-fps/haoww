import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const STYLE_INSTRUCTIONS: Record<string, string> = {
  photorealistic:
    "ultra-photorealistic, DSLR quality, sharp focus, natural lighting, 8k resolution, photorealistic",
  cinematic:
    "cinematic composition, dramatic lighting, anamorphic lens, film grain, movie still, golden hour, epic scale",
  anime:
    "anime art style, Studio Ghibli inspired, cel-shaded, vibrant colors, detailed linework, manga aesthetic",
  illustration:
    "digital illustration, concept art, detailed painterly style, rich colors, artistic, professional illustration",
  abstract:
    "abstract art, surreal composition, dreamlike, vibrant colors, artistic interpretation, non-literal",
};

router.post("/", async (req, res) => {
  const { text, style } = req.body as { text: string; style?: string };

  if (!text || text.trim().length < 3) {
    return res.status(400).json({ error: "Prompt text too short" });
  }

  const styleHint = style && STYLE_INSTRUCTIONS[style]
    ? `\nTarget style descriptors to naturally incorporate: ${STYLE_INSTRUCTIONS[style]}`
    : "";

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert AI image prompt engineer. Transform basic prompts into highly detailed, professional-grade generation prompts for Stable Diffusion, Midjourney, and DALL-E. 
Add: composition details, lighting, atmosphere, technical parameters, style descriptors, and quality enhancers.
Output ONLY the enhanced prompt — no explanations, no prefixes, no quotes.${styleHint}`,
      },
      {
        role: "user",
        content: text.trim(),
      },
    ],
    max_tokens: 400,
    temperature: 0.8,
  });

  const enhanced =
    completion.choices[0]?.message?.content?.trim() || text;

  return res.json({ enhanced, original: text });
});

export default router;
