import { LexicalEntryWordForm, AlriyadhCreateLexicalEntryDto, LexicalEntry } from '$lib/api-types';
import { API_BASE, API_KEY } from '../env';
import type { Entry } from './telegram';

export async function addEntryToDictionary({ word, meaning, root }: Entry) {
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
