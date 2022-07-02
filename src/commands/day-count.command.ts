import { MyContext } from "../index";
import { COMMANDS } from "../libs/constants";
import {
  errorHandler,
  getSetGroupResult,
  sendDisappearingMessage,
} from "../libs/utils";
import { restartCronJobs } from "../services/cron.service";
import { createDayCount } from "../services/day-count.service";
import { createGroup, deleteGroup } from "../services/group.service";

export const setGroupCommand = async (ctx: MyContext) => {
  try {
    if (!ctx.isGroup) {
      return ctx.reply("setGroup command can only be use in groups.");
    }

    // @ts-ignore
    const cleanedMessage = `${ctx.message?.text}`.replace(
      `/${COMMANDS.setGroup}`,
      ""
    );

    const chat = await ctx.getChat();
    const { message, dayCount, schedule } = getSetGroupResult(cleanedMessage);

    // message: message,
    // dayCount,
    // schedule,

    // @ts-ignore
    const createdGroup = await createGroup(ctx.chatId, chat.title);
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

export const removeGroupCommand = async (ctx: MyContext) => {
  try {
    if (!ctx.isGroup) return;
    await deleteGroup(Number(ctx.chat?.id));
    restartCronJobs();
    sendDisappearingMessage(ctx.chatId, `[Success]: Group removed.`);
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};
