import { renameFolderCommand } from "./../commands/broadcast.command";
import { dbClient } from "../libs";
import { sendMessage } from "../libs/utils";
import { findOneDayCount } from "./day-count.service";
import { createUser } from "./user.service";
import dotenv from "dotenv";
dotenv.config();

const { READING_GROUP_ID, SERVER_URL } = process.env;

export const createOneReader = async (
  accountId: number,
  readerName: string,
  readCount: number = 0,
  lastMessageId: number = 0
) => {
  return await dbClient.reader.create({
    data: {
      accountId,
      readerName,
      readCount,
      lastMessageId,
    },
  });
};

export const updateOneReader = async ({
  readerName,
  readCount = 0,
  lastMessageId = 0,
  accountId,
}: {
  readerName: string;
  readCount: number;
  lastMessageId: number;
  accountId?: number;
}) => {
  const payload: {
    readerName: string;
    readCount: number;
    lastMessageId: number;
    accountId?: number;
  } = {
    readerName,
    readCount,
    lastMessageId,
  };
  if (accountId) {
    payload["accountId"] = accountId;
  }
  return await dbClient.reader.update({
    where: {
      readerName,
    },
    data: payload,
  });
};

export const isReadingGroup = (groupId: number) =>
  Number(READING_GROUP_ID) === groupId;

export const findReaders = async () => {
  return await dbClient.reader.findMany({
    orderBy: { readCount: "desc" },
  });
};

export const findOneReader = async ({
  accountId,
  readerName,
}: {
  accountId?: number;
  readerName?: string;
}) => {
  const payload = accountId ? { accountId } : { readerName };
  const reader = await dbClient.reader.findUnique({
    where: payload,
  });
  // if (!reader) throw new Error(`Reader ${accountId} not found.`);

  return reader;
};

export const sendReport = async () => {
  try {
    const daycount = await findOneDayCount(
      Number(process.env.READING_GROUP_DAY_COUNT_ID)
    );

    if (!daycount) {
      throw new Error("Day count infomation not available.");
    }

    const readers = await findReaders();

    let report = `#${daycount.dayCount} អានប្រចាំថ្ងៃ 7AM:`;
    readers.map((reader, i) => {
      report += `\n${(i + 1).toString().padStart(2, "0")} - ${
        reader.readerName
      }: ${reader.readCount}`;
    });

    await sendMessage(Number(process.env.READING_GROUP_ID), report);
  } catch (err) {
    throw err;
  }
};

export const saveReadCount = async (
  accountId: number,
  readerName: string,
  readCount: number,
  lastMessageId: number
) => {
  const reader = await findOneReader({ readerName });
  const isNewMessage = lastMessageId >= (reader?.lastMessageId ?? 0);
  const readerProfile = await dbClient.reader.upsert({
    where: {
      readerName,
    },
    create: {
      accountId,
      readCount,
      readerName,
      lastMessageId,
    },
    update: {
      readCount: isNewMessage ? readCount : reader?.readCount ?? 0,
      lastMessageId: isNewMessage ? lastMessageId : reader?.lastMessageId ?? 0,
    },
    include: {
      person: true,
    },
  });
  return readerProfile;
};

export const deleteReader = async ({
  accountId,
  readerName,
}: {
  accountId?: number;
  readerName?: string;
}) => {
  if (!accountId && !readerName) {
    throw new Error("account id or reader name required.");
  }
  const payload = accountId ? { accountId } : { readerName };
  await dbClient.reader.delete({
    where: payload,
  });
};
