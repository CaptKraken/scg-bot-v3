import { MyContext } from "..";
import { COMMANDS } from "../libs/constants";
import {
  cancelKey,
  errorHandler,
  sendDisappearingMessage,
} from "../libs/utils";
import {
  createFolder,
  findAllFolders,
  renameFolder,
} from "../services/folder.service";

export const emitBroadcastCommand = async (ctx: MyContext) => {
  // @ts-ignore
  const message = ctx.message.text
    .replace(`/${COMMANDS.emit} `, "")
    .replace(`/${COMMANDS.emit}\n`, "")
    .trim();

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
        callback_data: `${COMMANDS.emit} -f${name} -m${message}`,
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
};

export const createFolderCommand = async (ctx: MyContext) => {
  try {
    //@ts-ignore
    const message = ctx.message.text;

    const folderName = message.replace(`/${COMMANDS.createFolder}`, "").trim();
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

export const renameFolderCommand = async (ctx: MyContext) => {
  try {
    // @ts-ignore
    const message: string = ctx.message.text;
    const parts = message
      .replace(`/${COMMANDS.renameFolder}`, "")
      .trim()
      .split("-")
      .map((part) => part.trim());

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
        `Old name or new name wasn't given.\ni.e. /renameFolder -o old name -n new name`
      );
    }

    await renameFolder(payload.folderName, payload.newName);
    await sendDisappearingMessage(
      ctx.chatId,
      `[Success]: Folder "${payload.folderName}" has been succesfully renamed to "${payload.newName}".`
    );
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

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
        callback_data: `${COMMANDS.deleteFolderAction} ${name}`,
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

export const addGroupBroadcastCommand = async (ctx: MyContext) => {
  try {
    if (!ctx.isGroup) {
      throw new Error(`Only available for group.`);
    }
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
    folders.forEach(({ name }, i) => {
      tempKeys.push({
        text: name,
        callback_data: `${COMMANDS.addGroupBroadcastAction} ${name}`,
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

export const removeGroupBroadcastCommand = async (ctx: MyContext) => {
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
        callback_data: `${COMMANDS.showRemoveGroupBroadcastAction} ${name}`,
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
