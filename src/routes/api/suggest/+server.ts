import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { JSDOM } from 'jsdom';

export const GET: RequestHandler = async ({ url }) => {
  const input = url.searchParams.get('q');
  if (input === null) throw error(400, 'Missing query parameter: q');

  // const params = new URLSearchParams({ term: input, lang: 'arabic' });
  // const res = await fetch('https://www.almaany.com/suggest.php?' + params.toString()+'&lang=arabic&t=d');
  const res=await scrapeArabiclexicon(input)
  if (!res) {
    // console.log(res);
    return json([]);
  }
  // const data = await res.json();
  console.log(res)
  return json(res);
};


const scrapeArabiclexicon = async (term: string) => {
  let relatedWords: string[] = [];
  const wordInUrl = encodeURIComponent(term);

  const url = `http://arabiclexicon.hawramani.com/search/${wordInUrl}`;

  const response = await fetch(url);

  const data = await response.text();
  if (!response.ok) throw new Error(data);
  console.log(url)
  const { window } = new JSDOM(data);
  const { document: dom } = window;
  const ulTag = dom.querySelector('div.search-item-container');
  const olTags= [...dom.querySelectorAll('div.search-item-container')];
  if (olTags) {
    relatedWords = olTags.flatMap((olTag) => {
      const liElements = [...olTag.querySelectorAll('h1.dictionary-entry-title')];
      const words = liElements.map((el) => (el.textContent ?? '').trim());
      return words;
    });
  }
  return relatedWords;
};