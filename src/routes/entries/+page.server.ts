import { listEntries } from '$lib/server/riyadh';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const entries = await listEntries();
  return { entries };
};
