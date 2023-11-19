import { JSDOM } from 'jsdom';

export const scrapeAlmaany = async (term: string) => {
  let relatedWords: string[] = [];
  let relatedSentences: string[] = [];
  const wordInUrl = encodeURIComponent(term);

  const url = `https://www.almaany.com/ar/dict/ar-ar/${wordInUrl}/`;

  const response = await fetch(url);

  const data = await response.text();
  if (!response.ok) throw new Error(data);

  const { window } = new JSDOM(data);
  const { document: dom } = window;
  const ulTag = dom.querySelector('div.panel-body.text-center ul.list-inline');

  if (ulTag) {
    const liElements = [...ulTag.querySelectorAll('li')];
    relatedWords = liElements.map((el) => (el.textContent ?? '').trim());
  }

  const olTags = [...dom.querySelectorAll('ol.meaning-results')];

  if (olTags) {
    relatedSentences = olTags.flatMap((olTag) => {
      const liElements = [...olTag.querySelectorAll('li')];
      const sentences = liElements.map((el) => (el.textContent ?? '').trim());
      return sentences;
    });
  }
  return {
    relatedWords,
    relatedSentences,
  };
};

export const scrapeArabiclexicon = async (term: string) => {
  let relatedWords: string[] = [];
  let relatedSentences: string[] = [];
  let firstResult;

  const wordInUrl = encodeURIComponent(term);

  const url = `http://arabiclexicon.hawramani.com/search/${wordInUrl}`;

  const response = await fetch(url);

  const data = await response.text();
  if (!response.ok) throw new Error(data);
  console.log(url);
  const { window } = new JSDOM(data);
  const { document: dom } = window;
  const ulTag = dom.querySelector('div.search-item-container');

  if (ulTag) {
    const liElement = ulTag.querySelector('h1.dictionary-entry-title');
    const spanRootElement = ulTag.querySelector('span.title1');
    const spanDefElement = ulTag.querySelector('.definition');
    firstResult = {
      word: liElement?.textContent ?? '',
      meaning: spanDefElement?.textContent ?? '',
      root: (await scrapeArabiclexiconRoot(term)) ?? '',
    };
  }

  const olTags = [...dom.querySelectorAll('div.search-item-container')];

  if (olTags) {
    relatedWords = olTags.flatMap((olTag) => {
      const liElements = [...olTag.querySelectorAll('h1.dictionary-entry-title')];
      const spanRootElements = [...olTag.querySelectorAll('span.title1')];
      const spanDefElements = [...olTag.querySelectorAll('.definition')];
      const words = liElements.map((el) => (el.textContent ?? '').trim());
      return words;
    });
  }
  return {
    relatedWords,
    relatedSentences,
    firstResult,
  };
};

export const scrapeArabiclexiconRoot = async (term: string) => {
  const wordInUrl = encodeURIComponent(term);
  const url = `http://arabiclexicon.hawramani.com/search/${wordInUrl}?cat=19`;
  console.log(url);
  const response = await fetch(url);
  const data = await response.text();
  if (!response.ok) throw new Error(data);
  console.log(url);
  const { window } = new JSDOM(data);
  const { document: dom } = window;
  const ulTag = dom.querySelector('div.search-item-container');
  if (ulTag) {
    const spanRootElement = ulTag.querySelector('span.title1');
    return spanRootElement?.textContent;
  }
};
