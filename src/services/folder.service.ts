import { dbClient } from "../libs/index.lib";

/**
 * finds all folders.
 * @returns a list for all folders.
 */
export const findAllFolders = async () => {
  return await dbClient.folder.findMany({
    include: {
      groups: true,
    },
  });
};

type NameOrIdDto = {
  id?: number;
  name?: string;
};
/**
 * finds one folder.
 * @param {NameOrIdDto} dto
 * @returns a folder record or null
 */
export const findOneFolder = async ({ id, name }: NameOrIdDto) => {
  if (!id && !name) {
    throw new Error("folder id or name required.");
  }

  const payload = id ? { id } : { name };

  return await dbClient.folder.findUnique({
    where: payload,
    include: {
      groups: true,
    },
  });
};

/**
 * creates a new folder.
 * @param {string} name folder name
 * @returns folder record
 */
export const createFolder = async (name: string) => {
  return await dbClient.folder.create({
    data: { name },
  });
};

/**
 * renames or creates a folder record.
 * @param {string} name old folder name
 * @param {string} newName new folder name
 * @returns folder record.
 */
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

/**
 * deletes a folder.
 * @param {NameOrIdDto} dto
 * @returns the deleted folder record.
 */
export const deleteFolder = async ({ id, name }: NameOrIdDto) => {
  if (!id && !name) {
    throw new Error("folder id or name required.");
  }

  const payload = id ? { id } : { name };
  return await dbClient.folder.delete({ where: payload });
};

/**
 * adds group to folder.
 * @param {string} folderName folder name
 * @param {number} groupId group id
 * @param {string} groupName group name
 * @returns folder record
 */
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

/**
 * removes a group from the folder.
 * @param {string} folderName folder name
 * @param {number} groupId group id
 * @returns
 */
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
