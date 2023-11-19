import { Telegraf, Markup, Scenes, session } from 'telegraf';
import { Mongo } from '@telegraf/session/mongodb';
import { TELEGRAM_BOT_TOKEN } from '$env/static/private';
import { addEntry, client, deleteEntry, getEntry, updateEntry } from './mongodb';
import { addEntryToDictionary } from './riyadh';

type SessionData = { originalMessageId: number; editing: 'word' | 'meaning' | 'root' | null };
const store = Mongo<SessionData>({ client });
type MyContext = Scenes.SceneContext<Scenes.SceneSessionData & SessionData>;
export const bot = new Telegraf<MyContext>(TELEGRAM_BOT_TOKEN);
// @ts-expect-error Some type errors internal in Telegraf
bot.use(session({ store }));

bot.start((ctx) => {
  ctx.reply(
    'مرحبا بك في بوت معجم الرياض! ليتم تسجيلك كمدقق لغوي، انضم إلى القناة: ' +
      'https://t.me/+NABwxibsrxNlOGNk',
  );
});

/** ID of the auditors channel */
const CHANNEL_ID = -1001967698482;

export type Entry = {
  word: string;
  meaning: string;
  root: string;
};
function renderEntry({ word, meaning, root }: Entry) {
  return `الكلمة: ${word}
المعنى: ${meaning}
الجذر: ${root}`;
}

/** Sends a given new entry for the dictionary to the Telegram channel for reviewers to verify */
export async function sendEntryForVerification(entry: Entry) {
  const message = 'برجاء مراجعة هذا المدخل المقترح:\n' + renderEntry(entry);
  const { message_id } = await bot.telegram.sendMessage(
    CHANNEL_ID,
    message,
    Markup.inlineKeyboard([
      Markup.button.callback('صحيحة ✅', 'correct'),
      Markup.button.callback('أريد تصحيح خطأ ⚠️', 'wrong'),
      Markup.button.callback('رفض الاقتراح ❌', 'reject'),
    ]),
  );

  // Add entry to Mongo
  await addEntry({
    ...entry,
    message_id,
    message_text: message,
  });
}

const fixScene = new Scenes.BaseScene<MyContext>('fix_entry');
fixScene.enter(async (ctx) => {
  const { originalMessageId } = ctx.scene.session;
  const entry = await getEntry(originalMessageId);
  if (entry == null) {
    // TODO: handle error properly
    return;
  }
  ctx.sendMessage(
    'ماذا تريد أن تعدل في هذه الكلمة؟\n' + renderEntry(entry),
    Markup.inlineKeyboard([
      Markup.button.callback('الكلمة', 'word'),
      Markup.button.callback('المعنى', 'meaning'),
      Markup.button.callback('الجذر', 'root'),
      Markup.button.callback('تمام 👍', 'done'),
    ]),
  );
});
fixScene.action('word', (ctx) => {
  // Fix the word itself
  ctx.answerCbQuery();
  ctx.scene.session.editing = 'word';
  ctx.sendMessage('أدخل الكلمة الجديدة:');
});
fixScene.action('meaning', (ctx) => {
  // Fix its meaning
  ctx.answerCbQuery();
  ctx.scene.session.editing = 'meaning';
  ctx.sendMessage('أدخل المعنى الجديد:');
});
fixScene.action('root', (ctx) => {
  // Fix its root
  ctx.answerCbQuery();
  ctx.scene.session.editing = 'root';
  ctx.sendMessage('أدخل الجذر الجديد:');
});
fixScene.action('done', (ctx) => {
  // Commit to DB and exit
  ctx.answerCbQuery();
  ctx.sendMessage('شكرًا على التعديل!');
  ctx.scene.leave();
});
fixScene.leave(async (ctx) => {
  const { originalMessageId } = ctx.scene.session;
  const entry = await getEntry(originalMessageId);
  if (entry == null) {
    // TODO: handle error properly
    return;
  }
  await addEntryToDictionary(entry);
});
fixScene.use(async (ctx) => {
  // Handle the new edit
  const { editing, originalMessageId } = ctx.scene.session;
  if (editing == null) return;
  await updateEntry(originalMessageId, {
    // @ts-ignore
    [editing]: ctx.message.text,
  });
  const entry = await getEntry(originalMessageId);
  if (entry == null) {
    // TODO: handle error properly
    return;
  }
  ctx.sendMessage(
    'ماذا تريد أن تعدل في هذه الكلمة؟\n' + renderEntry(entry),
    Markup.inlineKeyboard([
      Markup.button.callback('الكلمة', 'word'),
      Markup.button.callback('المعنى', 'meaning'),
      Markup.button.callback('الجذر', 'root'),
      Markup.button.callback('تمام 👍', 'done'),
    ]),
  );
});

// @ts-ignore
const stage = new Scenes.Stage([fixScene]);
// @ts-ignore
bot.use(stage.middleware());

bot.action('wrong', async (ctx) => {
  await ctx.answerCbQuery('شكراً لك على المساعدة. ستصلك رسالة على الخاص قريباً').catch();
  const { message, from } = ctx.callbackQuery;
  const { message_id } = message ?? {};
  if (message_id == null) {
    // Message is too old
    // TODO: handle properly and report back to the user.
    return;
  }
  await ctx.editMessageReplyMarkup(undefined).catch();
  const entry = await getEntry(message_id);
  if (entry == null) {
    // TODO: handle properly
    return;
  }
  const { message_text } = entry;

  const name = [from.first_name, from.last_name ?? ''].join(' ');
  await ctx.editMessageText(message_text + '\n\n' + `تم تكليف "${name}" بتصحيح الخطأ`).catch();

  const msg = await ctx.telegram.sendMessage(
    from.id,
    `اضغط على الزر لتبدأ تعديل الكلمة "${entry.word}".`,
    Markup.inlineKeyboard([Markup.button.callback('البدأ', 'start_fixing')]),
  );
  await updateEntry(message_id, { message_id: msg.message_id });
});

bot.action('start_fixing', async (ctx) => {
  await ctx.answerCbQuery();
  const { message_id } = ctx.callbackQuery.message ?? {};
  if (message_id == null) return;
  // await ctx.deleteMessage();
  ctx.scene.session.originalMessageId = message_id; // Because cannot get ID of original message in chat here
  await ctx.scene.enter('fix_entry');
});

bot.action('correct', async (ctx) => {
  await ctx.answerCbQuery('شكراً لك على المساعدة');
  const { message_id } = ctx.callbackQuery.message ?? {};
  if (message_id == null) {
    // Message is too old
    // TODO: handle properly and report back to the user.
    return;
  }
  const entry = await getEntry(message_id);
  if (entry == null) {
    // TODO: handle properly
    return;
  }
  const { message_text } = entry;

  await ctx.editMessageReplyMarkup(undefined);
  const name = [ctx.from?.first_name, ctx.from?.last_name ?? ''].join(' ');
  await ctx.editMessageText(message_text + '\n\n' + `وافق "${name}" على هذه الكلمة`);
  await addEntryToDictionary(entry);
});

bot.action('reject', async (ctx) => {
  ctx.answerCbQuery('شكراً لك على المساعدة');
  const { message_id } = ctx.callbackQuery.message ?? {};
  if (message_id == null) {
    // Message is too old
    // TODO: handle properly and report back to the user.
    return;
  }
  const entry = await getEntry(message_id);
  if (entry == null) {
    // TODO: handle properly
    return;
  }
  const { message_text } = entry;

  const name = [ctx.from?.first_name, ctx.from?.last_name ?? ''].join(' ');
  await deleteEntry(message_id);
  ctx.editMessageText(message_text + '\n\n' + `رفض "${name}" هذه الكلمة`);
  ctx.editMessageReplyMarkup(undefined);
});
