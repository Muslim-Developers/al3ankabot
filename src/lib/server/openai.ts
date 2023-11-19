import { OPENAI_API_KEY } from '$env/static/private';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function generateImage(wordExample: string) {
  const { data } = await openai.images.generate({
    prompt: wordExample,
    model: 'dall-e-3',
    quality: 'standard',
    style: 'natural',
    response_format: 'url',
    n: 1,
    size: '1024x1024',
  });
  return data[0].url!;
}
