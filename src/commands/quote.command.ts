import { Quote } from "@prisma/client";
import { MyContext } from "../index";
import {
  dbClient,
  csvToTable,
  errorHandler,
  sendDisappearingMessage,
} from "../libs/index.lib";
import {
  createManyQuotes,
  createQuote,
  deleteQuote,
} from "../services/index.service";
import { findOneQuote } from "../services/quote.service";

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
 * creates many quotes.
 */
export const createManyQuotesCommand = async (ctx: MyContext) => {
  try {
    if (!ctx.cleanedMessage?.trim()) return;
    const quotes = ctx.cleanedMessage.split("\n").filter((quote) => quote);
    await createManyQuotes(quotes);
    await sendDisappearingMessage(
      ctx.chatId,
      `[Success]: ${quotes.length} quotes added.`
    );
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

/**
 * Sends all quotes.
 */
export const sendQuoteListCommand = async (ctx: MyContext) => {
  const id = Number(ctx.cleanedMessage);
  let quotes: {
    text: string;
    id: number;
  }[] = [];
  if (id === NaN) {
    quotes = await dbClient.quote.findMany({
      orderBy: { id: "asc" },
      select: { id: true, text: true },
    });
  } else {
    quotes = await findOneQuote(id)
      .then((quote) => {
        return [
          {
            id: quote.id,
            text: quote.text,
          },
        ];
      })
      .catch((e) => {
        return [];
      });
  }
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
      `[Success]: Quote "${payload.text}" removed.`
    );
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};
