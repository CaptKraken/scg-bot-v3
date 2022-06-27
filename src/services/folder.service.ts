import { dbClient } from "../libs";

export const findAllFolders = async () => {
  return await dbClient.folder.findMany();
};

export const findOneFolder = async (id: number) => {
  const folder = await dbClient.folder.findUnique({
    where: {
      id,
    },
  });

  if (!folder) throw new Error(`folder ${id} not found.`);
  return folder;
};

export const createFolder = async (id: number, name: string) => {
  return await dbClient.folder.upsert({
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

export const deleteFolder = async (id: number) => {
  await dbClient.folder.delete({ where: { id } });
};
