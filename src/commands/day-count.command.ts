import { MyContext } from "../index";
import { dbClient } from "../libs";
import { COMMANDS } from "../libs/constants";
import {
  csvToTable,
  errorHandler,
  getSetGroupResult,
  sendDisappearingMessage,
} from "../libs/utils";
import { restartCronJobs } from "../services/cron.service";
import {
  createDayCount,
  deleteDayCount,
  updateDayCount,
} from "../services/day-count.service";
import { createGroup, deleteGroup } from "../services/group.service";

export const setGroupCommand = async (ctx: MyContext) => {
  try {
    if (!ctx.isGroup) {
      return ctx.reply("DC_NEW command can only be use in groups.");
    }

    const chat = await ctx.getChat();
    const { message, dayCount, schedule } = getSetGroupResult(
      ctx.cleanedMessage
    );

    // @ts-ignore
    await createGroup(ctx.chatId, chat.title);
    await createDayCount({
      groupId: ctx.chatId,
      dayCount,
      schedule,
      message,
    });

    restartCronJobs();
    sendDisappearingMessage(
      ctx.chatId,
      // @ts-ignore
      `[BOT]: Group ${chat.title} has been set up successfully.`
    );
  } catch (e) {
    errorHandler(ctx.chatId, e);
  }
};
export const updateGroupCommand = async (ctx: MyContext) => {
  try {
    if (!ctx.isGroup) {
      return ctx.reply("DC_NEW command can only be use in groups.");
    }

    const chat = await ctx.getChat();
    const { id, message, dayCount, schedule } = getSetGroupResult(
      ctx.cleanedMessage
    );

    if (!id) throw new Error("No id recieved. use flag -id to give id.");

    // @ts-ignore
    await createGroup(ctx.chatId, chat.title);
    await updateDayCount({
      id: Number(id),
      groupId: ctx.chatId,
      dayCount,
      schedule,
      message,
    });

    restartCronJobs();
    sendDisappearingMessage(
      ctx.chatId,
      // @ts-ignore
      `[BOT]: Group ${chat.title} has been updated successfully.`
    );
  } catch (e) {
    errorHandler(ctx.chatId, e);
  }
};

export const removeGroupCommand = async (ctx: MyContext) => {
  try {
    if (!ctx.isGroup) return;

    const id = Number(ctx.cleanedMessage);
    if (!id || isNaN(id)) throw new Error("Did not recieved id.");

    await deleteDayCount(id);
    restartCronJobs();
    sendDisappearingMessage(ctx.chatId, `[Success]: Group removed.`);
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

export const listDayCountCommand = async (ctx: MyContext) => {
  const dayCounts = await dbClient.dayCount.findMany({
    where: {
      groupId: ctx.chatId,
    },
    orderBy: [
      {
        id: "asc",
      },
    ],
    select: {
      id: true,
      dayCount: true,
      schedule: true,
      message: true,
    },
  });

  let csv = "ID,Day Count,Schedule,Message";

  dayCounts.map((dc) => {
    csv +=
      "\n" + dc.id + "," + dc.dayCount + "," + dc.schedule + "," + dc.message;
  });

  const mdTable = csvToTable(csv, ",", true);

  return ctx.reply(`\`\`\`${mdTable}\`\`\``, {
    parse_mode: "MarkdownV2",
  });
};
