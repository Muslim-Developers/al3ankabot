import { MongoClient } from 'mongodb';
import { MONGODB_URL } from '$env/static/private';

export const client = new MongoClient(MONGODB_URL);
const db = client.db('dictionary');

type Entry = {
  message_id: number;
  message_text: string;
  word: string;
  meaning: string;
  root: string;
};

const entries = db.collection<Entry>('new_entries');

export async function addEntry(entry: Entry) {
  await entries.insertOne(entry);
}

export async function getEntry(message_id: number) {
  const entry = await entries.findOne({ message_id });
  return entry;
}

export async function updateEntry(message_id: number, entry: Partial<Entry>) {
  await entries.updateOne({ message_id }, { $set: entry });
}

export async function deleteEntry(message_id: number) {
  await entries.deleteOne({ message_id });
}
