import { dbClient } from "../libs/index.lib";

/**
 * finds all user records.
 * @param {boolean} [withReaderProfile=false] whether to include the reader profile or not
 * @returns a list of all user records
 */
export const findAllUser = async (withReaderProfile: boolean = false) => {
  return await dbClient.person.findMany({
    include: {
      readerInfo: withReaderProfile,
    },
  });
};

/**
 * finds one user record by id.
 * @param {number} id user id
 * @param {boolean} [withReaderProfile=false] whether to include the reader profile or not
 * @returns one user record or null
 */
export const findOneUser = async (
  id: number,
  withReaderProfile: boolean = false
) => {
  return await dbClient.person.findUnique({
    where: { id },
    include: {
      readerInfo: withReaderProfile,
    },
  });
};

/**
 * creates or updates a new use record.
 * @param {number} id telegram user id
 * @param {string} name telegram user name
 * @param {boolean} [withReaderProfile=false] whether to include the reader profile or not
 * @returns a user record
 */
export const createUser = async (
  id: number,
  name: string,
  withReaderProfile: boolean = false
) => {
  const user = await dbClient.person.upsert({
    where: {
      id,
    },
    create: {
      id,
      name,
      role: "USER",
    },
    update: {
      id,
      name,
    },
    include: {
      readerInfo: withReaderProfile,
    },
  });
  return user;
};

/**
 * deletes a user record.
 * @param id user id
 * @returns the deleted user record.
 */
export const deleteUser = async (id: number) => {
  return await dbClient.person.delete({
    where: { id },
  });
};
