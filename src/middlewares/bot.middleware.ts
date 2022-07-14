import { MyContext } from "../index";
import { isSenderAdmin, removeCommand } from "../libs/utils";

const isGroup = (type?: string) => {
  return type === "group" || type === "supergroup";
};

/**
 * Puts isGroup, senderId, chatId, cleanedMessage, cleanedCallback in bot's context
 */
export const formatMiddleware = async (
  ctx: MyContext,
  next: () => Promise<void>
) => {
  ctx.isGroup = isGroup(ctx.chat?.type);
  ctx.senderId = Number(ctx.from?.id);
  ctx.chatId = Number(ctx.chat?.id);
  // @ts-ignore
  const messageText = ctx.message?.text;
  // @ts-ignore
  const callbackData = ctx.callbackQuery?.data;
  ctx.cleanedMessage = removeCommand(messageText);
  ctx.cleanedCallback = removeCommand(callbackData);
  return next();
};

/**
 * Checks if sender is an admin.
 */
export const isAdminMiddleware = async (
  ctx: MyContext,
  next: () => Promise<void>
) => {
  ctx.isAdmin = await isSenderAdmin(Number(ctx.from?.id));
  if (!ctx.isAdmin) return;
  return next();
};
