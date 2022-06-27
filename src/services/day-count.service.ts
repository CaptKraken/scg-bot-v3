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

  if (!dayCount) throw new Error(`Day count ${id} not found.`);
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
  const oldData = await findOneDayCount(id);

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

export const deleteDayCount = async (id: number) => {
  await dbClient.dayCount.delete({ where: { id } });
};