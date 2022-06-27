import { dbClient } from "../libs";

export const findAllGroups = async () => {
  return await dbClient.group.findMany();
};

export const findOneGroup = async (id: number) => {
  const group = await dbClient.group.findUnique({
    where: {
      id,
    },
  });

  if (!group) throw new Error(`Group ${id} not found.`);
  return group;
};

export const createGroup = async (id: number, name: string) => {
  return await dbClient.group.upsert({
    where: {
      id,
    },
    create: {
      id,
      name,
    },
    update: {
      id,
      name,
    },
  });
};

export const deleteGroup = async (id: number) => {
  await dbClient.group.delete({ where: { id } });
};
