import { MyContext } from "../index";
import { isSenderAdmin, removeCommand } from "../libs/utils";

export const formatMiddleware = async (
  ctx: MyContext,
  next: () => Promise<void>
) => {
  ctx.isGroup = ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";
  ctx.senderId = Number(ctx.from?.id);
  ctx.chatId = Number(ctx.chat?.id);
  ctx.cleanedMessage = "";
  // @ts-ignore
  const messageText = ctx.message?.text;
  // @ts-ignore
  const callbackData = ctx.callbackQuery?.data;
  if (messageText) {
    ctx.cleanedMessage = removeCommand(messageText);
  }
  if (callbackData) {
    ctx.cleanedCallback = removeCommand(callbackData);
  }
  return next();
};
export const isAdminMiddleware = async (
  ctx: MyContext,
  next: () => Promise<void>
) => {
  ctx.isAdmin = await isSenderAdmin(Number(ctx.from?.id));

  if (!ctx.isAdmin) return;
  return next();
};
