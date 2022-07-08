import { dbClient } from "../libs";
import { sendDisappearingMessage } from "../libs/utils";

// TODO: CHECK BEFORE CREATIGN NEW

export const createSkip = async (dayCountId: number, date?: Date) => {
  const skipRecord = await dbClient.skipDayCount.findMany({
    where: {
      dayCountId,
      date: date,
    },
  });
  if (skipRecord.length >= 0) return;
  return await dbClient.skipDayCount.create({
    data: {
      dayCountId,
      date: date,
    },
  });
};

export const createGroupSkips = async (groupId: number, date?: Date) => {
  const groupsDayCountIds = await dbClient.dayCount.findMany({
    where: {
      groupId,
    },
    select: { id: true },
  });
  if (groupsDayCountIds.length > 0) {
    return await dbClient.skipDayCount.createMany({
      data: groupsDayCountIds.map(({ id }) => {
        return {
          dayCountId: id,
          date: date,
        };
      }),
    });
  }
};

export const createGlobalSkips = async (date?: Date) => {
  const dayCountIds = await dbClient.dayCount.findMany({
    select: { id: true },
  });

  if (dayCountIds.length <= 0) {
    throw new Error(`មិនមានកំណត់ត្រា *day count*`);
  }

  const payload = dayCountIds.map(({ id }) => {
    return {
      dayCountId: id,
      date: date,
    };
  });

  const ids = await dbClient.skipDayCount.findMany({
    where: {
      OR: payload,
    },
    select: {
      dayCountId: true,
    },
  });

  const finalPayload =
    ids.length === 0
      ? payload
      : payload.filter((p) => ids.some((d) => d.dayCountId !== p.dayCountId));

  if (finalPayload.length <= 0) {
    throw new Error(
      `មានកំណត់ត្រារំលងថ្ងៃ${date?.toLocaleDateString("km-KH", {
        dateStyle: "full",
      })} រួចហើយ។`
    );
  }

  return await dbClient.skipDayCount.createMany({
    data: finalPayload,
  });
};
