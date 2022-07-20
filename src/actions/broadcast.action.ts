import { Group } from "@prisma/client";
import { MyContext } from "../index";
import {
  COMMANDS,
  cancelKey,
  errorHandler,
  goBackBroadcastKey,
  sendDisappearingMessage,
} from "../libs/index.lib";
import {
  findOneFolder,
  addGroupToFolder,
  removeGroupFromFolder,
  deleteFolder,
} from "../services/index.service";
import { deleteGroupCommand } from "../commands/index.command";

/**
 * emit a message to the selected folder.
 */
export const emitBroadcastAction = async (ctx: MyContext) => {
  try {
    ctx.answerCbQuery();
    ctx.deleteMessage();

    // @ts-ignore
    if (!ctx.cleanedCallback) return;

    const parts = ctx.cleanedCallback.split(" -").map((part) => part.trim());

    let folderName = "",
      message = "";

    parts.forEach((part) => {
      if (part.startsWith("f")) {
        folderName = part.slice(1);
      }
      if (part.startsWith("m")) {
        message = part.slice(1);
      }
    });

    if (!folderName || !message) {
      throw new Error("Error decoding data.");
    }

    const folder = await findOneFolder({ name: folderName });

    if (!folder) {
      throw new Error("Folder not found.");
    }
    if (!folder.groups || folder.groups.length < 1) {
      throw new Error("Folder has 0 group.");
    }

    const groups: Group[] = folder.groups;

    groups.forEach(({ id }, i) => {
      ctx.telegram.sendMessage(Number(id), message);
      if (i === groups.length - 1) {
        ctx.reply("Broadcast completed.");
      }
    });
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

/**
 * add group to the selected folder.
 */
export const addGroupToFolderAction = async (ctx: MyContext) => {
  try {
    ctx.answerCbQuery();
    ctx.deleteMessage();
    if (!ctx.cleanedCallback) return;

    const folderName = ctx.cleanedCallback;

    if (!folderName) {
      throw new Error(`Folder not found.`);
    }
    const chat = await ctx.getChat();

    // @ts-ignore
    await addGroupToFolder(folderName, chat.id, chat.title).catch((e) => {
      throw e;
    });

    await sendDisappearingMessage(
      ctx.chatId,
      // @ts-ignore
      `[SUCCESS]: Group "${chat.title}" was successfully added to "${folderName}."`
    );
  } catch (err) {
    errorHandler(ctx.chatId, err);
  }
};

/**
 * delete the selected folder.
 */
export const deleteFolderAction = async (ctx: MyContext) => {
  try {
    ctx.answerCbQuery();
    ctx.deleteMessage();

    if (!ctx.cleanedCallback) return;

    const folderName = ctx.cleanedCallback;
    await deleteFolder({ name: folderName });
    await sendDisappearingMessage(
      ctx.chatId,
      `[SUCCESS]: Folder "${folderName}" was deleted successfully.`
    );
  } catch (err) {
    errorHandler(ctx.chatId, err);
  }
};

/**
 * shows group list of the selected folder.
 */
export const listGroupsOfFolderAction = async (ctx: MyContext) => {
  try {
    ctx.answerCbQuery();
    ctx.deleteMessage();

    if (!ctx.cleanedCallback) return;

    const folderName = ctx.cleanedCallback;

    const folderData = await findOneFolder({ name: `${folderName}` });

    if (!folderName || !folderData) {
      throw new Error(`Folder not found.`);
    }

    const groups: Group[] = folderData.groups;

    type Keyboard = {
      callback_data: string;
      text: string;
    };

    const allKeys: any[] = [];
    let tempKeys: Keyboard[] = [];
    groups.forEach(({ id, name }, i) => {
      tempKeys.push({
        text: name,
        callback_data: `${COMMANDS.GROUP_DELETE_ACTION} -f${folderName} -g${id}`,
      });
      if (tempKeys.length === 2 || groups.length - 1 === i) {
        allKeys.push(tempKeys);
        tempKeys = [];
      }
    });

    allKeys.push(goBackBroadcastKey);
    allKeys.push(cancelKey);

    await ctx.reply(groups.length > 0 ? "Select group:" : "Group empty.", {
      reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: allKeys,
      },
    });
  } catch (err) {
    errorHandler(ctx.chatId, err);
  }
};

/**
 * delete a group from the selected folder.
 */
export const deleteGroupFromFolderAction = async (ctx: MyContext) => {
  try {
    ctx.answerCbQuery();
    ctx.deleteMessage();

    if (!ctx.cleanedCallback) return;

    const parts = ctx.cleanedCallback.split(" -").filter((part) => part);

    const payload = {
      folder_name: "",
      group_id: 0,
    };

    parts.forEach((part) => {
      if (part.startsWith("f")) {
        payload.folder_name = part.substring(1);
      }
      if (part.startsWith("g")) {
        payload.group_id = Number(part.substring(1));
      }
    });

    if (!payload.folder_name || !payload.group_id) {
      throw new Error(`Error decoding remove group broadcast action.`);
    }

    await removeGroupFromFolder(payload.folder_name, payload.group_id);
    await sendDisappearingMessage(
      ctx.chatId,
      `[Success]: Group removed from "${payload.folder_name}"`
    );
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

/**
 * goes back to delete group command.
 */
export const goBackBroadcastAction = async (ctx: MyContext) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage();
  await deleteGroupCommand(ctx);
};

/**
 * cancel button.
 */
export const cancelAction = async (ctx: MyContext) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage();
};
