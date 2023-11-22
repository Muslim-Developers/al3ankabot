import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TELEGRAM_BOT_SECRET } from '$env/static/private';
import { bot } from '$lib/server/telegram';

export const POST: RequestHandler = async ({ request }) => {
  if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== TELEGRAM_BOT_SECRET) {
    console.log('Received invalid update (incorrect secret token)');
    throw error(401, 'Invalid Telegram bot API secret token');
  }
  const data = await request.json();
  // console.log('Received update from Telegram:', data);
  await bot.handleUpdate(data);
  return new Response(null, { status: 204 });
};
