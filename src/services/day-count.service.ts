import cron from "node-cron";
import { dbClient } from "../libs";

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

export const findOneDayCount = async (id: number) => {
  const dayCount = await dbClient.dayCount.findUnique({
    where: {
      id,
    },
    include: {
      group: true,
    },
  });

  // if (!dayCount) throw new Error(`Day count ${id} not found.`);
  return dayCount;
};

type CreateDayCounter = {
  groupId: number;
  dayCount?: number;
  schedule?: string;
  message?: string;
};

export const createDayCount = async ({
  groupId,
  dayCount = 0,
  schedule = "0 0 * * *",
  message = "ថ្ងៃទី {day_count}",
}: CreateDayCounter) => {
  if (schedule && !cron.validate(schedule)) {
    throw new Error("Invalid schedule");
  }
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

export const updateDayCount = async ({
  id,
  groupId,
  dayCount,
  schedule,
  message,
}: UpdateDayCounter) => {
  if (schedule && !cron.validate(schedule)) {
    throw new Error("Invalid schedule");
  }
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

// export const increaseDayCount = async (ids: { id: number }[]) => {
//   if (ids.length <= 0) return;
//   await dbClient.dayCount.updateMany({
//     where: {
//       OR: [...ids],
//     },
//     data: {
//       dayCount: { increment: 1 },
//     },
//   });
// };

export const increaseDayCount = async (id: number, amount: number = 1) => {
  return await dbClient.dayCount.update({
    where: {
      id,
    },
    data: { dayCount: { increment: amount } },
  });
};

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
export const increaseDayCountOfGroup = async (
  groupId: number,
  amount: number = 1
) => {
  return await dbClient.dayCount.updateMany({
    where: { groupId },
    data: { dayCount: { increment: amount } },
  });
};
export const increaseAllDayCounts = async (amount: number = 1) => {
  return await dbClient.dayCount.updateMany({
    data: {
      dayCount: {
        increment: amount,
      },
    },
  });
};
export const increaseManyDayCounts = async (
  ids: number[],
  amount: number = 1
) => {
  const dayCountIds = ids.map((id) => {
    return {
      id,
    };
  });
  return await dbClient.dayCount.updateMany({
    where: {
      OR: dayCountIds,
    },
    data: { dayCount: { increment: amount } },
  });
};

export const decreaseManyDayCounts = async (
  ids: number[],
  amount: number = 1
) => {
  const dayCountIds = ids.map((id) => {
    return {
      id,
    };
  });
  await dbClient.dayCount.updateMany({
    where: {
      OR: dayCountIds,
    },
    data: {
      dayCount: { decrement: amount },
    },
  });
};

export const deleteDayCount = async (id: number) => {
  await dbClient.dayCount.delete({ where: { id } });
};
