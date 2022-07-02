import { Context } from "telegraf";
import { Update } from "typegram";
import { MyContext } from "../index";
import { COMMANDS } from "../libs/constants";
import { errorHandler, sendDisappearingMessage } from "../libs/utils";
import { createQuote, deleteQuote } from "../services/quote.service";

export const addQuoteCommand = async (ctx: MyContext) => {
  try {
    // @ts-ignore
    const quote: string | undefined = ctx.message.text
      .replace(`/${COMMANDS.addQuote}`, "")
      .trim();
    if (!quote) return;
    await createQuote(quote);
    await sendDisappearingMessage(ctx.chatId, `[Success]: '${quote}' added.`);
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

export const removeQuoteCommand = async (ctx: MyContext) => {
  try {
    // @ts-ignore
    const message: string | undefined = ctx.message.text
      ?.replace(`/${COMMANDS.removeQuote}`, "")
      ?.trim();
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
