import { dbClient } from "../libs";
import { createUser } from "./user.service";

export const findReaders = async () => {
  try {
    const readers = await dbClient.reader.findMany();
    return readers;
  } catch (error) {
    throw error;
  }
};

export const findOneReader = async (accountId: number) => {
  try {
    const reader = await dbClient.reader.findUnique({
      where: {
        accountId,
      },
    });
    if (!reader) throw new Error(`Reader ${accountId} not found.`);

    return reader;
  } catch (error) {
    throw error;
  }
};

export const saveReadCount = async (
  accountId: number,
  readerName: string,
  readCount: number,
  lastMessageId: number
) => {
  try {
    const user = await createUser(accountId, readerName, true);

    const isNewMessage = lastMessageId >= (user.readerInfo?.lastMessageId ?? 0);

    const readerProfile = await dbClient.reader.upsert({
      where: {
        accountId,
      },
      create: {
        accountId,
        readCount,
        readerName,
        lastMessageId,
      },
      update: {
        accountId,
        readCount,
        readerName,
        lastMessageId: isNewMessage
          ? lastMessageId
          : user.readerInfo?.lastMessageId,
      },
      include: {
        person: true,
      },
    });

    return readerProfile;
  } catch (error) {
    throw error;
  }
};

export const deleteReader = async (accountId: number) => {
  try {
    await dbClient.reader.delete({
      where: { accountId },
    });
  } catch (error) {
    throw error;
  }
};
