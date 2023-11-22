import { generateImage } from '$lib/server/openai';
import { scrapeArabiclexicon } from '$lib/server/scraping';
import type { Actions } from './$types';
import { sendEntryForVerification } from '$lib/server/telegram';
import { findEntry } from '$lib/server/riyadh';
import { error } from '@sveltejs/kit';

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const word = formData.get('word') as string;
    if (!word) {
      throw error(400, 'Missing word');
    }
    const entry = await findEntry(word);

    if (entry == null) {
      // TODO: mark the word as needing a definition, adding it to the DB and sending a Telegram msg
      const { firstResult } = await scrapeArabiclexicon(word);
      if (firstResult) {
        sendEntryForVerification(firstResult);
      }
      return [];
    }

    const { word: wordForm, example, definition } = entry;
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
