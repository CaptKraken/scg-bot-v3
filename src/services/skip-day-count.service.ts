import { dbClient } from "../libs";
import { sendDisappearingMessage } from "../libs/utils";

export const findSkips = async (dayCountId: number, date: Date) => {
  return await dbClient.skipDayCount.findMany({
    where: {
      dayCountId,
      date,
    },
  });
};

export const createSkip = async (dayCountId: number, date?: Date) => {
  const skipRecord = await dbClient.skipDayCount.findFirst({
    where: {
      dayCountId,
      date: date,
    },
  });
  if (skipRecord) return skipRecord;
  return await dbClient.skipDayCount.create({
    data: {
      dayCountId,
      date: date,
    },
  });
};

export const deleteOneSkip = async (id: number) => {
  return await dbClient.skipDayCount.delete({
    where: {
      id,
    },
  });
};
export const deleteManySkips = async (dayCountId?: number, date?: Date) => {
  const payload: { dayCountId?: number; date?: Date } = {};
  if (dayCountId) {
    payload["dayCountId"] = dayCountId;
  }
  if (date) {
    payload["date"] = date;
  }
  // if nothing got passed, delete everything.
  await dbClient.skipDayCount.deleteMany({
    where: payload,
  });
};
export const deleteGroupSkips = async (groupId: number, date?: Date) => {
  await dbClient.skipDayCount.deleteMany({
    where: {
      dayCount: {
        groupId,
      },
      date,
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

  const payload = groupsDayCountIds.map(({ id }) => {
    return {
      dayCountId: id,
      date: date,
    };
  });

  const skipRecords = await dbClient.skipDayCount.findMany({
    where: {
      dayCount: {
        groupId,
      },
      date,
    },
    select: {
      dayCountId: true,
      date: true,
    },
  });

  const finalPayload =
    skipRecords.length === 0
      ? payload
      : payload.filter((p) =>
          skipRecords.some((sr) => sr.dayCountId !== p.dayCountId)
        );

  if (finalPayload.length > 0) {
    await dbClient.skipDayCount.createMany({
      data: finalPayload,
      skipDuplicates: true,
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

  if (finalPayload.length > 0) {
    await dbClient.skipDayCount.createMany({
      data: finalPayload,
    });
  }
};
