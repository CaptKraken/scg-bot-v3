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
  createOneReader,
  deleteReader,
  findOneReader,
  isReadingGroup,
  saveReadCount,
  sendReport,
  updateOneReader,
} from "../services/reader.service";
import { COMMANDS } from "../libs/constants";
import { MyContext } from "../index";
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
    const name = parts[1];
    const hasEnoughData = isNumber(count.toString()) && name && messageId;

    if (!hasEnoughData) return;
    const userData = await createUser(
      ctx.senderId,
      `${ctx.from?.first_name ?? ""} + ${ctx.from?.last_name ?? ""}`,
      true
    );
    const hasReaderProfile = Boolean(userData.readerInfo);
    const readerProfile = await findOneReader({ readerName: name });

    // reader record doesn't exist
    if (!readerProfile) {
      // if sender has no reader profile
      if (!hasReaderProfile) {
        // create reader with sender id
        return await createOneReader(ctx.senderId, name, count, messageId);
      }
      // if sender has reader profile
      // generate a dummy account
      const dummyId = Math.floor(Math.random() * 1000);
      const dummyUser = await createUser(dummyId, "Dummy User");
      // create reader profile with dummy
      return await createOneReader(dummyUser.id, name, count, messageId);
    }

    // reader record doesn't exist
    const isReaderADummyAccount = readerProfile.accountId <= 1000;
    const isDummyAccountAndNoReaderProfile =
      isReaderADummyAccount && !hasReaderProfile;
    if (isDummyAccountAndNoReaderProfile) {
      return updateOneReader({
        accountId: ctx.senderId,
        readerName: name,
        readCount: count,
        lastMessageId: messageId,
      });
    }
    // update read
    return updateOneReader({
      readerName: name,
      readCount: count,
      lastMessageId: messageId,
    });
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
