import { dbClient } from "../libs";
import { sendMessage } from "../libs/utils";
import { findOneDayCount } from "./day-count.service";
import { createUser } from "./user.service";
import dotenv from "dotenv";
dotenv.config();

const { READING_GROUP_ID, SERVER_URL } = process.env;

export const isReadingGroup = (groupId: number) =>
  Number(READING_GROUP_ID) === groupId;

export const findReaders = async () => {
  return await dbClient.reader.findMany({
    orderBy: { readCount: "asc" },
  });
};

export const findOneReader = async (accountId: number) => {
  const reader = await dbClient.reader.findUnique({
    where: {
      accountId,
    },
  });
  if (!reader) throw new Error(`Reader ${accountId} not found.`);

  return reader;
};

export const sendReport = async () => {
  try {
    const daycount = await findOneDayCount(
      Number(process.env.READING_GROUP_DAY_COUNT_ID)
    );

    if (!daycount) {
      return sendMessage(
        Number(process.env.READING_GROUP_ID),
        "Day count infomation not available."
      );
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
    throw new Error(`function: "sendReport"\nerror: ${err}`);
  }
};

export const saveReadCount = async (
  accountId: number,
  readerName: string,
  readCount: number,
  lastMessageId: number
) => {
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
      readCount: isNewMessage ? readCount : user.readerInfo?.readCount,
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
