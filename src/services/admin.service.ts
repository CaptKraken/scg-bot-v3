import { dbClient } from "../libs/index.lib";

/**
 * finds all admins.
 */
export const findAllAdmins = async () => {
  return await dbClient.person.findMany({
    where: {
      role: "ADMIN",
    },
  });
};

/**
 * generate an admin list message.
 */
export const getAdminList = async () => {
  const allAdmins = await findAllAdmins();
  if (allAdmins.length <= 0) return "Admin list empty.";

  let message = "Admins:";

  const sortedAdmins = allAdmins.sort((a, b) => {
    if (a.name > b.name) return -1;
    if (a.name < b.name) return 1;
    return 0;
  });

  sortedAdmins.map((admin, i) => {
    message += `\n${(i + 1).toString().padStart(2, "0")} - ${admin.name} : ${
      admin.id
    }`;
  });
  return message;
};

/**
 * creates or updates a new user as admin.
 * @param {string} name user name
 * @param {number} id user id
 * @returns a person record
 */
export const createNewAdmin = async (name: string, id: number) => {
  return await dbClient.person.upsert({
    where: {
      id,
    },
    create: {
      id,
      name,
      role: "ADMIN",
    },
    update: {
      name,
      role: "ADMIN",
    },
  });
};

/**
 * updates the person record with given id the role of 'USER'.
 * @param id user id
 * @returns updated person record
 */
export const deleteAdmin = async (id: number) => {
  return await dbClient.person.update({
    where: { id },
    data: {
      role: "USER",
    },
  });
};
