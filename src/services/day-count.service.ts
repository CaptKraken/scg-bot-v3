import { dbClient } from "../libs/index.lib";

/**
 * Finds all the day count records.
 * @returns a list of day count records
 */
export const findAllDayCounts = async () => {
  return await dbClient.dayCount.findMany({
    orderBy: {
      groupId: "asc",
    },
    include: {
      group: true,
    },
  });
};

/**
 * Finds one day count record with the given id.
 * @param {number} id day count record id
 * @returns
 */
export const findOneDayCount = async (id: number) => {
  const dayCount = await dbClient.dayCount.findUnique({
    where: {
      id,
    },
    include: {
      group: true,
    },
  });
  return dayCount;
};

type CreateDayCounter = {
  groupId: number;
  dayCount?: number;
  schedule?: string;
  message?: string;
};

/**
 * creates a day count record.
 * @param {CreateDayCounter} dto
 * @returns a day count record with group record
 */
export const createDayCount = async ({
  groupId,
  dayCount = 0,
  schedule = "0 0 * * *",
  message = "ថ្ងៃទី $count",
}: CreateDayCounter) => {
  return await dbClient.dayCount.create({
    data: {
      groupId,
      dayCount,
      schedule,
      message,
    },
    include: {
      group: true,
    },
  });
};

type UpdateDayCounter = {
  id: number;
  groupId: number;
  dayCount?: number;
  schedule?: string;
  message?: string;
};

/**
 * updates day count record.
 * @param {UpdateDayCounter} dto
 * @returns a day count record with group record.
 */
export const updateDayCount = async ({
  id,
  groupId,
  dayCount,
  schedule,
  message,
}: UpdateDayCounter) => {
  const oldData = await findOneDayCount(id);
  if (!oldData) {
    throw new Error(`Day count data id ${id} was found.`);
  }

  return await dbClient.dayCount.update({
    where: {
      id,
    },
    data: {
      groupId: groupId ?? oldData.groupId,
      dayCount: dayCount ?? oldData.dayCount,
      schedule: schedule ?? oldData.schedule,
      message: message ?? oldData.message,
    },
    include: {
      group: true,
    },
  });
};

/**
 * increases day count of a day count record.
 * @param {number} id day count record id
 * @param {number} [amount=1] amount to increase
 * @returns day count record
 */
export const increaseDayCount = async (id: number, amount: number = 1) => {
  return await dbClient.dayCount.update({
    where: {
      id,
    },
    data: { dayCount: { increment: amount } },
  });
};

/**
 * decreases day count of a day count record.
 * @param {number} id day count record id
 * @param {number} [amount=1] amount to decrease
 * @returns day count record
 */
export const decreaseDayCount = async (id: number, amount: number = 1) => {
  return await dbClient.dayCount.update({
    where: {
      id,
    },
    data: {
      dayCount: { decrement: amount },
    },
  });
};

/**
 * increases day count records of a group.
 * @param {number} groupId group id
 * @param {number} [amount=1] amount to increase
 * @returns amount of records updated.
 */
export const increaseDayCountOfGroup = async (
  groupId: number,
  amount: number = 1
) => {
  return await dbClient.dayCount.updateMany({
    where: { groupId },
    data: { dayCount: { increment: amount } },
  });
};

/**
 * increases all day count records.
 * @param {number} [amount=1] amount to increase
 * @returns amount of records updated.
 */
export const increaseAllDayCounts = async (amount: number = 1) => {
  return await dbClient.dayCount.updateMany({
    data: {
      dayCount: {
        increment: amount,
      },
    },
  });
};

/**
 * deletes a day count record.
 * @param {number} id
 * @returns the deleted day count record
 */
export const deleteDayCount = async (id: number) => {
  return await dbClient.dayCount.delete({ where: { id } });
};
