import { LexicalEntryWordForm, AlriyadhCreateLexicalEntryDto, LexicalEntry } from '$lib/api-types';
import { API_BASE, API_KEY } from '$lib/env';
import { levenshteinDistance } from '$lib/helpers/string-utils';
import type { Entry } from './telegram';

export async function findEntry(word: string) {
  // Their API's SSL is currently misconfigured
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
  const params = new URLSearchParams({ query: word });
  const response = await fetch(`${API_BASE}/search?${params.toString()}`, {
    headers: {
      apikey: API_KEY,
    },
  });
  const data: LexicalEntry[] = await response.json();
  if (data.length === 0) {
    return null;
  }
  data.sort((e1, e2) => {
    if (e2.wordForms.length === 0 || e2.wordForms[0].formRepresentations.length === 0) {
      return -1;
    }
    if (e1.wordForms.length === 0 || e1.wordForms[0].formRepresentations.length === 0) {
      return 1;
    }

    const word1 = e1.wordForms[0].formRepresentations[0].form;
    const word2 = e2.wordForms[0].formRepresentations[0].form;
    return levenshteinDistance(word, word1) > levenshteinDistance(word, word2) ? 1 : -1;
  });
  const entry = data[0];
  const wordForm = entry.wordForms[0].formRepresentations[0].form;
  // find first nonempty example
  const example = entry.senses[0]?.examples.find((e) => e.form)?.form ?? '';
  const definition: string =
    // @ts-expect-error The types are not perfect
    entry.senses[0]?.definition.textRepresentations?.find((r) => r.form)?.form ?? '';
  return {
    word: wordForm,
    example,
    definition,
  };
}

export async function addEntryToDictionary({ word, meaning, root }: Entry) {
  // Their API's SSL is currently misconfigured
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
  const lexicalEntry: AlriyadhCreateLexicalEntryDto = {
    lemma: {
      formRepresentations: [],
      type: '',
    },
    stems: [
      {
        formRepresentations: [
          {
            form: root,
            audio: '',
            dialect: '',
            phonetic: '',
          },
        ],
        type: '',
      },
    ],
    wordForms: [
      {
        formRepresentations: [{ form: word, audio: '', dialect: '', phonetic: '' }],
        aspect: LexicalEntryWordForm.AspectEnum.P,
        def: LexicalEntryWordForm.DefEnum.I,
        gender: LexicalEntryWordForm.GenderEnum.M,
        isNasab: false,
        isSmall: false,
        numberWordForm: LexicalEntryWordForm.NumberWordFormEnum._1,
        person: LexicalEntryWordForm.PersonEnum._1,
        voice: LexicalEntryWordForm.VoiceEnum.P,
      },
    ],
    senses: [
      {
        definition: {
          // @ts-expect-error incorrect types
          textRepresentations: [{ form: meaning }],
        },
        examples: [],
        contexts: [],
        domainIds: [],
        domains: [],
        image: '',
        relations: [],
        translations: [],
      },
    ],
    morphologicalPatterns: '',
    pos: AlriyadhCreateLexicalEntryDto.PosEnum.A,
    plain: 'string',
    verbOrigin: AlriyadhCreateLexicalEntryDto.VerbOriginEnum.A,
    nounOrigin: AlriyadhCreateLexicalEntryDto.NounOriginEnum.Mm,
    originality: AlriyadhCreateLexicalEntryDto.OriginalityEnum.A,
    hasTanween: false,
  };

  const res = await fetch(API_BASE + '/create/entry', {
    method: 'POST',
    body: JSON.stringify(lexicalEntry),
    headers: {
      'Content-Type': 'application/json',
      apikey: API_KEY,
    },
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  console.log(`Added "${word}" (${root}) to dictionary.`);
}

export async function listEntries() {
  // Their API's SSL is currently misconfigured
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
  const res = await fetch(API_BASE + '/find/all/my/entries', {
    headers: {
      apikey: API_KEY,
    },
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  const data: LexicalEntry[] = await res.json();
  return data;
}
