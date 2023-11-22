import { JSDOM } from 'jsdom';
import { GPT_LINK } from '$env/static/private';

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
    if (firstResult.word !== term) {
      const { relatedSentences } = await scrapeMaajim(term);
      const gptResult = await askAnotherGPT4(term, relatedSentences.join('\n'));
      if (
        gptResult != null &&
        'word' in gptResult &&
        'meaning' in gptResult &&
        'root' in gptResult
      ) {
        firstResult = gptResult;
      }
    }
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

export const scrapeMaajim = async (term: string) => {
  let relatedWords: string[] = [];
  let relatedSentences: string[] = [];
  const wordInUrl = encodeURIComponent(term);

  const url = `https://www.maajim.com/dictionary/${wordInUrl}/`;

  const response = await fetch(url);

  const data = await response.text();
  console.log(data);
  if (!response.ok) throw new Error(data);

  const { window } = new JSDOM(data);
  const { document: dom } = window;
  // const ulTag = dom.querySelector('div.panel-body.text-center ul.list-inline');

  // if (ulTag) {
  //   const liElements = [...ulTag.querySelectorAll('li')];
  //   relatedWords = liElements.map((el) => (el.textContent ?? '').trim());
  // }

  const olTags = [...dom.querySelectorAll('section div.parag div.result div.collapse')];
  relatedSentences = olTags.map((el) => (el.textContent ?? '').trim());
  // if (olTags) {
  //   relatedSentences = olTags.flatMap((olTag) => {
  //     const liElements = [...olTag.querySelectorAll('li')];
  //     const sentences = liElements.map((el) => (el.textContent ?? '').trim());
  //     return sentences;
  //   });
  // }
  return {
    relatedWords,
    relatedSentences,
  };
};

export const askAnotherGPT4 = async (q: string, sentncesOneLine: string) => {
  const url = GPT_LINK;

  const headers = {
    authority: GPT_LINK,
    accept: '*/*',
    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8,ar;q=0.7,ru;q=0.6',
    'content-type': 'application/json',
    origin: 'https://docgpt.io',
    referer: 'https://docgpt.io/',
    'sec-ch-ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': 'macOS',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
  };

  const systemMessage = `
      Your mission is to retrieve JSON with authentic verified data in Arabic, you will be provided with #Textual_information after the given word to get the information from it.
      Here is an exmaple for the output JSON:
        {
        "word": ${q},  الكلمة
        "meaning": "" معنى الكلمة
        "root": "",   الاصل او الجذر
        "synonyms:""   مرادف الكلمة
        "Trochee": "" التحليل الصرفي للكلمة
        }

        All values in JSON should be in arabic. Only reply in JSON.
  `;

  const data = {
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: q + '\n#Textual_information:' + sentncesOneLine },
    ],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseData = await response.json();
    // Adjust the parsing of responseData according to the JSON structure
    return JSON.parse(responseData.choices?.[0]?.message?.content ?? null);
  } catch (error) {
    console.error('Error:', error);
    return '';
  }
};
