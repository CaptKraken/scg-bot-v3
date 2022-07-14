import { MyContext } from "../index";
import {
  dbClient,
  csvToTable,
  errorHandler,
  sendDisappearingMessage,
} from "../libs/index.lib";
import { createQuote, deleteQuote } from "../services/index.service";

/**
 * creates new quote.
 */
export const createQuoteCommand = async (ctx: MyContext) => {
  try {
    // @ts-ignore
    const quote: string | undefined = ctx.cleanedMessage.trim();
    if (!quote) return;
    await createQuote(quote);
    await sendDisappearingMessage(ctx.chatId, `[Success]: '${quote}' added.`);
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

/**
 * Sends all quotes.
 */
export const sendQuoteListCommand = async (ctx: MyContext) => {
  const quotes = await dbClient.quote.findMany({
    orderBy: { id: "asc" },
    select: { id: true, text: true },
  });
  let csv = "ID\tQuote";
  quotes.map((quote) => {
    csv += "\n" + quote.id + "\t" + quote.text;
  });
  const mdTable = csvToTable(csv, "\t", true);

  return ctx.reply(`\`\`\`${mdTable}\n\nTotal: ${quotes.length}\`\`\``, {
    parse_mode: "MarkdownV2",
  });
};

/**
 * deletes a quote.
 */
export const deleteQuoteCommand = async (ctx: MyContext) => {
  try {
    const message = ctx.cleanedMessage.trim();
    if (!message) return;

    const payload = isNaN(Number(message))
      ? { text: message }
      : { id: Number(message) };

    await deleteQuote(payload);
    await sendDisappearingMessage(
      ctx.chatId,
      `[Success]: Quote ${payload} removed.`
    );
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};
