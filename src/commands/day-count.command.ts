import { Prisma } from "@prisma/client";
import { MyContext } from "../index";
import { dbClient } from "../libs";
import { COMMANDS, COMMAND_GROUPS, dayCountCommands } from "../libs/constants";
import { getTomorrow, khmerDateToISO } from "../libs/time.utils";
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
  deleteGroupSkips,
  deleteManySkips,
  deleteOneSkip,
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
  const showAll = ctx.cleanedMessage.includes("-a");

  const dayCounts = await dbClient.dayCount.findMany({
    where: showAll
      ? {}
      : {
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
        .filter((command) => command.includes(COMMANDS.SKIP_NEW))
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

export const deleteSkipCommand = async (ctx: MyContext) => {
  // -a -g -id -d

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
  if (!ctx.cleanedMessage) {
    // TODO: Update this to use the right command
    const guide = dayCountCommands.commands
      .filter((command) => command.includes(COMMANDS.SKIP_DELETE))
      .join();

    return sendDisappearingErrorMessage(
      ctx.chatId,
      `Insufficient data.\nUsage: ${guide}`,
      10
    );
  }

  const parts = ctx.cleanedMessage.split("-").filter((part) => part.trim());

  parts.map((part) => {
    if (part.startsWith("d")) {
      const recievedDate = part
        .replace("d", "")
        .replace(/"/g, "")
        .replace(/'/g, "")
        .trim();
      data["date"] = khmerDateToISO(recievedDate);
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

  const dateText = data.date?.toLocaleDateString("km-KH", {
    dateStyle: "full",
  });
  const successMsg = dateText
    ? `Skip schedule on ${dateText} deleted.`
    : "Skip schedule deleted.";

  if (data.group) {
    await deleteGroupSkips(ctx.chatId, data.date);
    return sendDisappearingMessage(ctx.chatId, successMsg);
  }

  if (data.all) {
    await deleteManySkips(data.id, data.date); // delete all
    return sendDisappearingMessage(ctx.chatId, successMsg);
  }

  if (data.id) {
    await deleteOneSkip(data.id);
    return sendDisappearingMessage(ctx.chatId, successMsg);
  }
};
