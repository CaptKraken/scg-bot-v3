import { Update } from "typegram";
import { Context } from "telegraf";
import {
  errorHandler,
  isSenderAdmin,
  sendDisappearingMessage,
} from "../libs/utils";
import {
  addGlobalAdmin,
  getAdminList,
  removeGlobalAdmin,
} from "../services/admin.service";
import { MyContext } from "../index";

export const sendAdminListCommand = async (ctx: MyContext) => {
  try {
    const adminList = await getAdminList();
    return ctx.reply(adminList);
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

export const addGlobalAdminCommand = async (ctx: MyContext) => {
  try {
    if (!ctx.isAdmin) return;

    // @ts-ignore
    const toBeAdmin = ctx.message?.reply_to_message?.from;
    if (!toBeAdmin) return;

    const firstName = toBeAdmin.first_name;
    const lastName = toBeAdmin.last_name;
    const username = toBeAdmin.username;

    const userId = toBeAdmin.id;
    const userName =
      firstName && lastName ? `${firstName} ${lastName}` : `${username}`;

    await addGlobalAdmin(userName, userId);
    await sendDisappearingMessage(
      ctx.chatId,
      `[Success]: "${userName}" is added to the database.`
    );
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

export const removeGlobalAdminCommand = async (ctx: MyContext) => {
  try {
    // @ts-ignore
    const toBeAdmin = ctx.message?.reply_to_message?.from;
    if (!toBeAdmin) return;

    const userId = toBeAdmin.id;

    await removeGlobalAdmin(userId);
    await sendDisappearingMessage(
      ctx.chatId,
      `[Success]: User removed from the database.`
    );
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};
