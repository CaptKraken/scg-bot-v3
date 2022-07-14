import { MyContext } from "../index";
import {
  COMMANDS,
  convertKhmerToArabicNumerals,
  isNumber,
  errorHandler,
  sendDisappearingMessage,
} from "../libs/index.lib";
import {
  createUser,
  deleteUser,
  deleteReader,
  findOneReader,
  createOneReader,
  isReadingGroup,
  sendReport,
  updateOneReader,
} from "../services/index.service";

/**
 * Creates or updates read records.
 * @param {MyContext} ctx telegraf context
 * @param {boolean} [isNew=true] is the message new or edited. default=true
 */
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

    const count = convertKhmerToArabicNumerals(parts[0].replace(/#/g, ""));
    const name = parts[1];
    const hasEnoughData =
      isNumber(count.toString()) && Boolean(name) && Boolean(messageId);

    if (!hasEnoughData) return;
    const userData = await createUser(
      ctx.senderId,
      `${ctx.from?.first_name ?? ""} ${ctx.from?.last_name ?? ""}`,
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
      const dummyId = () => Math.floor(Math.random() * 1000);
      const dummyUser = await createUser(dummyId(), "Dummy User");
      // create reader profile with dummy
      return await createOneReader(dummyUser.id, name, count, messageId);
    }

    // reader record doesn't exist
    const isReaderADummyAccount = readerProfile.accountId <= 1000;
    const isDummyAccountAndNoReaderProfile =
      isReaderADummyAccount && !hasReaderProfile;
    if (isDummyAccountAndNoReaderProfile) {
      const dummyAccountId = readerProfile.accountId;
      // link sender id with reader profile
      await updateOneReader({
        accountId: ctx.senderId,
        readerName: name,
        readCount: count,
        lastMessageId: messageId,
      });
      // delete the dummy user
      return await deleteUser(dummyAccountId);
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

/**
 * Removes one reader
 * @param {MyContext} ctx
 */
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

/**
 * Sends reading report to the reading group on telegram.
 * @param {MyContext} ctx
 */
export const readReportCommand = async (ctx: MyContext) => {
  try {
    await sendReport();
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};
