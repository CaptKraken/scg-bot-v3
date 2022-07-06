import { dbClient } from "../libs";

export const findAllAdmins = async () => {
  const ADMIN_LIST = await dbClient.person.findMany({
    where: {
      role: "ADMIN",
    },
  });
  return ADMIN_LIST;
};

export const getAdminList = async () => {
  const ADMIN_LIST = await findAllAdmins();
  if (ADMIN_LIST.length <= 0) return "Admin list empty.";

  let message = "Admins:";

  const sortedAdmins = ADMIN_LIST.sort((a, b) => {
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

export const ADMIN_NEW = async (name: string, id: number) => {
  const addedAdmin = await dbClient.person.upsert({
    where: {
      id,
    },
    create: {
      id,
      name,
      role: "ADMIN",
    },
    update: {
      id,
      name,
      role: "ADMIN",
    },
  });

  return addedAdmin;
};

export const ADMIN_DELETE = async (id: number) => {
  await dbClient.person.delete({
    where: { id },
  });
};
