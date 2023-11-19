import { API_BASE, API_KEY } from '$lib/env';
import { generateImage } from '$lib/server/openai';
import { scrapeArabiclexicon } from '$lib/server/scraping';
import type { LexicalEntry } from '$lib/api-types';
import type { Actions } from './$types';
import { sendEntryForVerification } from '$lib/server/telegram';

export const actions: Actions = {
  default: async ({ fetch, request }) => {
    // Their API's SSL is currently misconfigured
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    const formData = await request.formData();
    const word = formData.get('word') as string;
    const params = new URLSearchParams({ query: word });
    const response = await fetch(`${API_BASE}/search?${params.toString()}`, {
      headers: {
        apikey: API_KEY,
      },
    });
    const data: LexicalEntry[] = await response.json();

    if (data.length === 0) {
      // TODO: mark the word as needing a definition, adding it to the DB and sending a Telegram msg
      const { firstResult } = await scrapeArabiclexicon(word);
      if (firstResult) {
        sendEntryForVerification(firstResult);
      }
      return [];
    }
    const entry = data[0];

    const wordForm = entry.wordForms[0].formRepresentations[0].form;
    const example = entry.senses[0]?.examples.find((e) => e.form)?.form ?? '';
    const definition =
      // @ts-expect-error The types are not perfect
      entry.senses[0]?.definition.textRepresentations?.find((r) => r.form)?.form ?? '';
    let imgUrl = '';
    if (example) {
      imgUrl = await generateImage(example);
    } else if (definition) {
      imgUrl = await generateImage(definition);
    }
    const dictionaryUrl = `https://dictionary.ksaa.gov.sa/result/${wordForm}`;

    return [
      {
        word: wordForm,
        definition,
        example,
        imgUrl,
        dictionaryUrl,
      },
    ];
  },
};
