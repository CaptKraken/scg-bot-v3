import { Update } from "typegram";
import { Context } from "telegraf";
import {
  csvToTable,
  errorHandler,
  isSenderAdmin,
  sendDisappearingMessage,
} from "../libs/utils";
import {
  ADMIN_NEW,
  getAdminList,
  ADMIN_DELETE,
} from "../services/admin.service";
import { MyContext } from "../index";
import { dbClient } from "../libs";

/**
 * Sends admin list to the group.
 */
export const sendAdminListCommand = async (ctx: MyContext) => {
  try {
    const adminList = await dbClient.person.findMany({
      where: {
        role: "ADMIN",
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    });
    let csv = `,ID,Name`;

    adminList.map((admin, i) => {
      csv +=
        `\n` + `${i + 1}`.padStart(2, "0") + "," + admin.id + "," + admin.name;
    });

    const list = csvToTable(csv, ",", true);

    return ctx.reply(`\`\`\`${list}\n\nTotal: ${adminList.length}\`\`\``, {
      parse_mode: "MarkdownV2",
    });
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

/**
 * add user as admin.
 */
export const createAdminCommand = async (ctx: MyContext) => {
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

    await ADMIN_NEW(userName, userId);
    await sendDisappearingMessage(
      ctx.chatId,
      `[Success]: "${userName}" is added to the database.`
    );
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

/**
 * delete user as admin.
 */
export const deleteAdminCommand = async (ctx: MyContext) => {
  try {
    // @ts-ignore
    const toBeAdmin = ctx.message?.reply_to_message?.from;
    if (!toBeAdmin) return;

    const userId = toBeAdmin.id;

    await ADMIN_DELETE(userId);
    await sendDisappearingMessage(
      ctx.chatId,
      `[Success]: User removed from the database.`
    );
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};
