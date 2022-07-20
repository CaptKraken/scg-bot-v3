import { dbClient } from "../libs/index.lib";

/**
 * finds all groups.
 * @returns a list of groups
 */
export const findAllGroups = async () => {
  return await dbClient.group.findMany();
};

/**
 * finds one group.
 * @param {number} id group id
 * @returns a group record
 */
export const findOneGroup = async (id: number) => {
  const group = await dbClient.group.findUnique({
    where: {
      id,
    },
  });

  if (!group) throw new Error(`Group ${id} not found.`);
  return group;
};

/**
 * creates or updates the group record.
 * @param {number} id group id
 * @param {string} name group name
 * @returns group record
 */
export const createGroup = async (id: number, name: string) => {
  console.log("create group", id, name);

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

/**
 * deletes a group record.
 * @param {number} id group id
 * @returns the deleted group record
 */
export const deleteGroup = async (id: number) => {
  return await dbClient.group.delete({ where: { id } });
};
