import { MyContext } from "..";
import { COMMANDS } from "../libs/constants";
import {
  cancelKey,
  errorHandler,
  removeCommand,
  sendDisappearingMessage,
} from "../libs/utils";
import {
  createFolder,
  findAllFolders,
  updateFolder,
} from "../services/folder.service";

/**
 * select a folder to emit the message.
 */
export const emitBroadcastCommand = async (ctx: MyContext) => {
  try {
    if (!ctx.cleanedMessage) throw new Error("no message recieved.");

    const folders = await findAllFolders();
    if (folders.length < 1) {
      return await ctx.reply("[Info]: No folder found.");
    }

    type Keyboard = {
      callback_data: string;
      text: string;
    };

    const allKeys: any[] = [];
    let tempKeys: Keyboard[] = [];
    folders.forEach(({ name, groups }, i) => {
      if (groups.length > 0) {
        tempKeys.push({
          text: `${name} (${groups.length})`,
          callback_data: `${COMMANDS.EMIT_ACTION} -f${name} -m${ctx.cleanedMessage}`,
        });
      }
      if (tempKeys.length === 2 || folders.length - 1 === i) {
        allKeys.push(tempKeys);
        tempKeys = [];
      }
    });
    if (allKeys.length > 0) {
      allKeys.push(cancelKey);
    }
    await ctx.reply(`Select folder:\n(Folders with 0 group are hidden)`, {
      reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: allKeys,
      },
    });
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};
/**
 * creates a new folder.
 */
export const createFolderCommand = async (ctx: MyContext) => {
  try {
    const folderName = ctx.cleanedMessage;
    if (!folderName) {
      throw new Error("folder name not found.");
    }
    await createFolder(folderName);
    await sendDisappearingMessage(
      ctx.chatId,
      `[Success]: Folder "${folderName}" created.`
    );
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

/**
 * updates a folder's name.
 */
export const renameFolderCommand = async (ctx: MyContext) => {
  try {
    if (!ctx.cleanedMessage) {
      throw new Error(`Not enough data received.`);
    }
    const parts = ctx.cleanedMessage.split("-").map((part) => part.trim());

    type RenameFolderDTO = {
      folderName: string;
      newName: string;
    };

    const payload: RenameFolderDTO = {
      folderName: "",
      newName: "",
    };

    parts.forEach((part) => {
      if (part.startsWith("o")) {
        payload.folderName = part.replace("o", "").trim();
      }
      if (part.startsWith("n")) {
        payload.newName = part.replace("n", "").trim();
      }
    });

    const isOldNameValid = payload.folderName && payload.folderName.length > 0;
    const isNewNameValid = payload.folderName && payload.folderName.length > 0;

    if (!isOldNameValid || !isNewNameValid) {
      ctx.reply(
        `Old name or new name wasn't given.\ni.e. /FOLDER_EDIT -o old name -n new name`
      );
    }

    await updateFolder(payload.folderName, payload.newName);
    await sendDisappearingMessage(
      ctx.chatId,
      `[Success]: Folder "${payload.folderName}" has been succesfully renamed to "${payload.newName}".`
    );
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

/**
 * choose folder to delete.
 */
export const deleteFolderCommand = async (ctx: MyContext) => {
  try {
    const folders = await findAllFolders();
    if (folders.length < 1) {
      await ctx.reply("[Info]: No folder found.");
      return;
    }

    type Keyboard = {
      callback_data: string;
      text: string;
    };

    const allKeys: any[] = [];
    let tempKeys: Keyboard[] = [];
    folders.forEach(({ name }, i) => {
      tempKeys.push({
        text: name,
        callback_data: `${COMMANDS.FOLDER_DELETE_ACTION} ${name}`,
      });
      if (tempKeys.length === 2 || folders.length - 1 === i) {
        allKeys.push(tempKeys);
        tempKeys = [];
      }
    });
    if (allKeys.length > 0) {
      allKeys.push(cancelKey);
    }
    await ctx.reply(`Choose folder to delete:`, {
      reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: allKeys,
      },
    });
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

/**
 * select a folder to add the current group to.
 */
export const createGroupCommand = async (ctx: MyContext) => {
  try {
    if (!ctx.isGroup) {
      throw new Error(`Only available for group.`);
    }
    const folders = await findAllFolders();
    if (folders.length < 1) {
      return await ctx.reply("[Info]: No folders found.");
    }

    type Keyboard = {
      callback_data: string;
      text: string;
    };

    const allKeys: Keyboard[][] = [];
    let tempKeys: Keyboard[] = [];
    folders.forEach(({ name }, i) => {
      tempKeys.push({
        text: name,
        callback_data: `${COMMANDS.GROUP_NEW_ACTION} ${name}`,
      });
      if (tempKeys.length === 2 || folders.length - 1 === i) {
        allKeys.push(tempKeys);
        tempKeys = [];
      }
    });
    if (allKeys.length > 0) {
      allKeys.push(cancelKey);
    }
    await ctx.reply(`Add group to:`, {
      reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: allKeys,
      },
    });
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

/**
 * select a folder to see group to delete.
 */
export const deleteGroupCommand = async (ctx: MyContext) => {
  try {
    const folders = await findAllFolders();
    if (folders.length < 1) {
      await ctx.reply("[Info]: No folders found.");
      return;
    }

    type Keyboard = {
      callback_data: string;
      text: string;
    };

    const allKeys: any[] = [];
    let tempKeys: Keyboard[] = [];
    folders.forEach(({ name, groups }, i) => {
      tempKeys.push({
        text: `${name} (${groups.length})`,
        callback_data: `${COMMANDS.GROUP_LIST_DELETE_ACTION} ${name}`,
      });
      if (tempKeys.length === 2 || folders.length - 1 === i) {
        allKeys.push(tempKeys);
        tempKeys = [];
      }
    });
    if (allKeys.length > 0) {
      allKeys.push(cancelKey);
    }
    await ctx.reply(`Select folder:`, {
      reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: allKeys,
      },
    });
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};
