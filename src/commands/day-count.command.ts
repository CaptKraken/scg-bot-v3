import { Prisma } from "@prisma/client";
import { MyContext } from "../index";
import {
  dbClient,
  COMMANDS,
  dayCountCommands,
  getTomorrow,
  khmerDateToISO,
  csvToTable,
  errorHandler,
  getSetGroupResult,
  sendDisappearingErrorMessage,
  sendDisappearingMessage,
} from "../libs/index.lib";
import {
  restartCronJobs,
  createDayCount,
  deleteDayCount,
  increaseAllDayCounts,
  increaseDayCount,
  increaseDayCountOfGroup,
  updateDayCount,
  createGroup,
  createGlobalSkips,
  createGroupSkips,
  createSkip,
  deleteGroupSkips,
  deleteManySkips,
  deleteOneSkip,
} from "../services/index.service";

/**
 * Creates a new day count record.
 */
export const createDayCountCommand = async (ctx: MyContext) => {
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

/**
 * Updates a day count record.
 */
export const updateDayCountCommand = async (ctx: MyContext) => {
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

/**
 * Deletes a day count record.
 */
export const deleteDayCountCommand = async (ctx: MyContext) => {
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

/**
 * Sends all day count records to the group.
 */
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

/**
 * Creates a skip day count record.
 */
export const createSkipDayCountCommand = async (ctx: MyContext) => {
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

/**
 * Deletes a skip day count record.
 */
export const deleteSkipDayCountCommand = async (ctx: MyContext) => {
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

/**
 * Updates day count of day count records.
 */
export const dayCountControlCommand = async (ctx: MyContext) => {
  const match = ctx.cleanedMessage.match(
    /(-id\s([0-9]+)\s?(-?[0-9]+)?|-a(\s(-?[0-9]+))?|-g(\s(-?[0-9]+))?)/g
  );
  if (!match) return;

  const command = match[0].trim();

  if (command.startsWith("-id")) {
    const [id, amount] = command
      .replace(/-id/g, "")
      .split(" ")
      .filter((part) => part)
      .map((part) => Number(part));
    if (!id) {
      throw new Error(`Error transforming data`);
    }
    if (amount === 0) {
      return await sendDisappearingMessage(ctx.chatId, `No changed was made.`);
    }
    const updated = await increaseDayCount(id, amount ?? -1);
    return await sendDisappearingMessage(
      ctx.chatId,
      `Day count ${id} ${amount > 0 ? "increased" : "decreased"} ${
        amount ?? -1
      } to ${updated?.dayCount}.`
    );
  }
  if (command.startsWith("-g")) {
    const amount = parseInt(command.replace(/-g/g, ""));
    if (amount === 0) {
      return await sendDisappearingMessage(ctx.chatId, `No changed was made.`);
    }
    const isValidAmount = !isNaN(amount);
    const updated = await increaseDayCountOfGroup(
      ctx.chatId,
      isValidAmount ? amount : -1
    );
    return await sendDisappearingMessage(
      ctx.chatId,
      `${amount > 0 ? "Increased" : "Decreased"} ${
        isValidAmount ? amount : -1
      } for ${updated?.count} day count records.`
    );
  }
  if (command.startsWith("-a")) {
    const amount = parseInt(command.replace(/-a/g, ""));
    if (amount === 0) {
      return await sendDisappearingMessage(ctx.chatId, `No changed was made.`);
    }
    const isValidAmount = !isNaN(amount);
    const updated = await increaseAllDayCounts(isValidAmount ? amount : -1);
    return await sendDisappearingMessage(
      ctx.chatId,
      `${amount > 0 ? "Increased" : "Decreased"} ${
        isValidAmount ? amount : -1
      } for ${updated?.count} day count records.`
    );
  }
};
