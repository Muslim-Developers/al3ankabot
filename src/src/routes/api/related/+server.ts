import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { scrapeArabiclexicon } from '$lib/server/scraping';

export const GET: RequestHandler = async ({ url }) => {
  const input = url.searchParams.get('q');
  if (input === null) throw error(400, 'Missing query parameter: q');

  try {
    const data = await scrapeArabiclexicon(input);
    return json(data);
  } catch (err) {
    console.error(err);
    throw error(500, 'Error scraping almaany: ' + (err as any).toString());
  }
};
