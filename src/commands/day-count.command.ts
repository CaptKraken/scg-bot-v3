import { Prisma } from "@prisma/client";
import { MyContext } from "../index";
import { dbClient } from "../libs";
import { COMMANDS, COMMAND_GROUPS, dayCountCommands } from "../libs/constants";
import {
  csvToTable,
  errorHandler,
  getSetGroupResult,
  sendDisappearingErrorMessage,
  sendDisappearingMessage,
} from "../libs/utils";
import { restartCronJobs } from "../services/cron.service";
import {
  createDayCount,
  decreaseDayCount,
  deleteDayCount,
  updateDayCount,
} from "../services/day-count.service";
import { createGroup, deleteGroup } from "../services/group.service";
import {
  createGlobalSkips,
  createGroupSkips,
  createSkip,
} from "../services/skip-day-count.service";

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

    if (schedule) {
      restartCronJobs();
    }
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

export const isValidDate = (date: Date | string) => {
  return !isNaN(new Date(date).getTime());
};

const khmerDateToISO = (date: string) => {
  if (!date) return undefined;
  const parts = date.split("/");
  const { day, month, year } = {
    day: parts[0],
    month: parts[1],
    year: parts[2],
  };

  const formatted = new Date(
    `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00.000Z`
  );

  return isValidDate(formatted) ? formatted : undefined;
};
const getTomorrow = () => {
  const today = new Date();
  let tomorrow = new Date(new Date().setDate(today.getDate() + 1));
  // idk why. UTC +7, maybe?
  tomorrow = new Date(new Date(tomorrow).setHours(7, 0, 0, 0));
  return tomorrow;
};

export const skipDayCountCommand = async (ctx: MyContext) => {
  const data: {
    date?: Date;
    id?: number;
    group: boolean;
    all: boolean;
  } = {
    date: undefined,
    id: undefined,
    group: false,
    all: false,
  };
  try {
    if (!ctx.cleanedMessage) {
      const guide = dayCountCommands.commands
        .filter((command) => command.includes(COMMANDS.DAY_SKIP))
        .join();

      return sendDisappearingErrorMessage(
        ctx.chatId,
        `Insufficient data.\nUsage: ${guide}`,
        10
      );
    }
    const parts = ctx.cleanedMessage.split("-").filter((part) => part.trim());
    const hasDate = parts.some((part) => part.startsWith("d"));

    parts.map((part) => {
      if (hasDate && part.startsWith("d")) {
        const recievedDate = part
          .replace("d", "")
          .replace(/"/g, "")
          .replace(/'/g, "")
          .trim();
        data["date"] = khmerDateToISO(recievedDate);
      } else {
        // set default date to tommorow
        data["date"] = getTomorrow();
      }
      if (part.startsWith("id")) {
        const id = Number(part.replace("id", "").trim());
        if (isNaN(id)) return;
        data["id"] = id;
      }

      if (part.startsWith("a")) {
        data["all"] = true;
      }

      if (part.startsWith("g")) {
        data["group"] = true;
      }
    });

    if (data.id) {
      await createSkip(data.id, data.date);
      return sendDisappearingMessage(
        ctx.chatId,
        `Skip schedule on  ${data.date?.toLocaleDateString("km-KH", {
          dateStyle: "full",
        })}added.`
      );
    }

    if (data.group) {
      await createGroupSkips(ctx.chatId, data.date);
      return sendDisappearingMessage(
        ctx.chatId,
        `បានដាក់រំលងថ្ងៃ${data.date?.toLocaleDateString("km-KH", {
          dateStyle: "full",
        })} អោយគ្រប់កាលវិភាគក្នុងក្រុមនេះ។`
      );
    }

    if (data.all) {
      await createGlobalSkips(data.date);
      return sendDisappearingMessage(
        ctx.chatId,
        `បានដាក់រំលងថ្ងៃ${data.date?.toLocaleDateString("km-KH", {
          dateStyle: "full",
        })} អោយគ្រប់កាលវិភាគទាំងអស់។`
      );
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return sendDisappearingMessage(
          ctx.chatId,
          `Day count record '${data.id}' not found.\nUse /listdc to see the list of this group's schedules.`,
          10
        );
      }
    }

    errorHandler(ctx.chatId, error);
  }
};
