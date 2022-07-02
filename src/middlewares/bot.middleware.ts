import { MyContext } from "../index";
import { isSenderAdmin } from "../libs/utils";

export const formatMiddleware = async (
  ctx: MyContext,
  next: () => Promise<void>
) => {
  ctx.isGroup = ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";
  ctx.senderId = Number(ctx.from?.id);
  ctx.chatId = Number(ctx.chat?.id);
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
