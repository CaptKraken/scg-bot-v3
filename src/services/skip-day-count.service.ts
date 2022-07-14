import { dbClient } from "../libs/index.lib";

/**
 * finds all skip records.
 * @param {number} dayCountId day count id
 * @param {Date} date skip date
 * @returns a list of skip records.
 */
export const findSkips = async (dayCountId: number, date: Date) => {
  return await dbClient.skipDayCount.findMany({
    where: {
      dayCountId,
      date,
    },
  });
};

/**
 * creates a skip record.
 * @param {number} dayCountId day count id
 * @param {Date} date skip date
 * @returns the created skip record.
 */
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

/**
 * deletes a skip record.
 * @param {number} id skip id
 * @returns the deleted skip record.
 */
export const deleteOneSkip = async (id: number) => {
  return await dbClient.skipDayCount.delete({
    where: {
      id,
    },
  });
};

/**
 * deletes many skip records.
 * @param {number} dayCountId ```optional``` day count id
 * @param {Date} date ```optional``` date of records
 * @returns number of records deleted.
 */
export const deleteManySkips = async (dayCountId?: number, date?: Date) => {
  const payload: { dayCountId?: number; date?: Date } = {};
  if (dayCountId) {
    payload["dayCountId"] = dayCountId;
  }
  if (date) {
    payload["date"] = date;
  }
  // if nothing got passed, delete everything.
  return await dbClient.skipDayCount.deleteMany({
    where: payload,
  });
};

/**
 * deletes a group's skip records
 * @param {number} groupId group id
 * @param {Date} date ```optional``` date of records
 * @returns number of records deleted.
 */
export const deleteGroupSkips = async (groupId: number, date?: Date) => {
  return await dbClient.skipDayCount.deleteMany({
    where: {
      dayCount: {
        groupId,
      },
      date,
    },
  });
};

/**
 * create a skip record for all group's day count.
 * @param {number} groupId group id
 * @param {Date} date ```optional``` date of records
 * @returns number of records created
 */
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
    return await dbClient.skipDayCount.createMany({
      data: finalPayload,
      skipDuplicates: true,
    });
  }
};

/**
 * creates a skip records for all day counts.
 * @param {Date} date ```optional``` date of records
 * @returns number of records created
 */
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
    return await dbClient.skipDayCount.createMany({
      data: finalPayload,
    });
  }
};
