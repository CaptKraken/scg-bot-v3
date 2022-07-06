import { dbClient } from "../libs";

export const findAllFolders = async () => {
  return await dbClient.folder.findMany({
    include: {
      groups: true,
    },
  });
};

export const findOneFolder = async ({
  id,
  name,
}: {
  id?: number;
  name?: string;
}) => {
  if (!id && !name) {
    throw new Error("folder id or name required.");
  }

  const payload = id ? { id } : { name };

  const folder = await dbClient.folder.findUnique({
    where: payload,
    include: {
      groups: true,
    },
  });

  return folder;
};

export const createFolder = async (name: string) => {
  return await dbClient.folder.create({
    data: { name },
  });
};

export const updateFolder = async (name: string, newName: string) => {
  if (!name || !newName) {
    throw new Error("Old and new name required.");
  }
  return await dbClient.folder.upsert({
    where: {
      name,
    },
    create: {
      name: newName,
    },
    update: {
      name: newName,
    },
  });
};

export const deleteFolder = async ({
  id,
  name,
}: {
  id?: number;
  name?: string;
}) => {
  if (!id && !name) {
    throw new Error("folder id or name required.");
  }

  const payload = id ? { id } : { name };
  await dbClient.folder.delete({ where: payload });
};

export const addGroupToFolder = async (
  folderName: string,
  groupId: number,
  groupName: string
) => {
  return await dbClient.folder.update({
    where: { name: folderName },
    data: {
      groups: {
        connectOrCreate: {
          where: {
            id: groupId,
          },
          create: {
            id: groupId,
            name: groupName,
          },
        },
      },
    },
  });
};
export const removeGroupFromFolder = async (
  folderName: string,
  groupId: number
) => {
  return await dbClient.folder.update({
    where: { name: folderName },
    data: {
      groups: {
        disconnect: [{ id: groupId }],
      },
    },
  });
};
