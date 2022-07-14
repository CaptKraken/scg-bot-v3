import { dbClient, sendMessage } from "../libs/index.lib";
import { findOneDayCount } from "./index.service";
import dotenv from "dotenv";
import { Reader } from "@prisma/client";
dotenv.config();

const { READING_GROUP_ID } = process.env;

/**
 * Creates one reader record
 * @param accountId telegram user id
 * @param readerName reader name
 * @param readCount read count
 * @param lastMessageId last message id
 * @returns reader record
 */
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

/**
 * updates a reader record.
 * @param {Object} payload {readerName, readerCount?=0, lastMessageId?=0, accountId?}
 * @returns reader record
 */
export const updateOneReader = async ({
  readerName,
  readCount = 0,
  lastMessageId = 0,
  accountId,
}: {
  readerName: string;
  readCount?: number;
  lastMessageId?: number;
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

/**
 * Checks if the given group id is the reading group.
 * @param {number} groupId telegram chat id
 * @returns {boolean}
 */
export const isReadingGroup = (groupId: number): boolean =>
  Number(READING_GROUP_ID) === groupId;

/**
 * Finds all readers records.
 * @returns a list of reader records.
 */
export const findReaders = async (): Promise<Reader[]> => {
  return await dbClient.reader.findMany({
    orderBy: { readCount: "desc" },
  });
};

/**
 * Finds one reader record.
 * @param {number} [accountId=undefined] telegram user id
 * @param {string} [readerName=undefined] reader name
 * @returns a reader record or null
 */
export const findOneReader = async ({
  accountId,
  readerName,
}: {
  accountId?: number;
  readerName?: string;
}): Promise<Reader | null> => {
  const payload = accountId ? { accountId } : { readerName };
  return await dbClient.reader.findUnique({
    where: payload,
  });
};

/**
 * Sends reader report to the reading group.
 */
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

/**
 * deletes a reader record.
 * @param {Object} payload  - data needed for deletion
 * @param {number} payload.accountId - telegram user id
 * @param {string} payload.readerName - reader name
 */
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
