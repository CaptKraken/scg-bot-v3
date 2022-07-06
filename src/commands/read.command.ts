import { Update } from "typegram";
import { Context } from "telegraf";
import {
  convertKhmerToArabicNumerals,
  errorHandler,
  isNumber,
  isSenderAdmin,
  sendDisappearingMessage,
} from "../libs/utils";
import {
  deleteReader,
  isReadingGroup,
  saveReadCount,
  sendReport,
} from "../services/reader.service";
import { COMMANDS } from "../libs/constants";
import { MyContext } from "../index";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import e from "express";
import { createUser } from "../services/user.service";

export const updateReadCountCommand = async (
  ctx: MyContext,
  isNew: boolean = true
) => {
  try {
    const message: string = isNew
      ? // @ts-ignore
        ctx.message?.text?.trim()
      : // @ts-ignore
        ctx.update.edited_message?.text;
    const messageId = isNew
      ? //@ts-ignore
        ctx.message?.message_id
      : //@ts-ignore
        ctx.update?.edited_message?.message_id;

    const isRightGroup = isReadingGroup(ctx.chatId);
    const isStartsWithHashtag = message?.startsWith("#");
    const isValidGroupAndMessage = isRightGroup && isStartsWithHashtag;

    if (!isValidGroupAndMessage) return;

    const parts: string[] = message
      .replace("\n", " ")
      .split(" ")
      .filter((part: string) => part);

    const needsDummy = message.includes("-dd");
    const count = convertKhmerToArabicNumerals(parts[0].replace("#", ""));
    const user = parts[1];
    const hasEnoughData = isNumber(count.toString()) && user && messageId;

    if (hasEnoughData) {
      if (needsDummy) {
        const dummyId = Math.floor(Math.random() * 1000);
        const dummyUser = await createUser(dummyId, "Dummy User");
        return await saveReadCount(dummyUser.id, user, count, messageId);
      }
      return await saveReadCount(ctx.senderId, user, count, messageId);
    }
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

export const removeReaderCommand = async (ctx: MyContext) => {
  try {
    const readerName = ctx.cleanedMessage.trim();

    if (!readerName) {
      throw new Error(
        `Reader's name not found.\nExample: /${COMMANDS.READER_DELETE} សុង`
      );
    }

    await deleteReader({ readerName });
    sendDisappearingMessage(
      ctx.chatId,
      `[Success]: "${readerName}" removed from database.`
    );
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

export const readReportCommand = async (ctx: MyContext) => {
  try {
    await sendReport();
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};
