import { dbClient } from "../libs";

export const findAllAdmins = async () => {
  const admins = await dbClient.person.findMany({
    where: {
      role: "ADMIN",
    },
  });
  return admins;
};

export const getAdminList = async () => {
  const admins = await findAllAdmins();
  if (admins.length <= 0) return "Admin list empty.";

  let message = "Admins:";

  const sortedAdmins = admins.sort((a, b) => {
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

export const addGlobalAdmin = async (name: string, id: number) => {
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

export const removeGlobalAdmin = async (id: number) => {
  await dbClient.person.delete({
    where: { id },
  });
};
