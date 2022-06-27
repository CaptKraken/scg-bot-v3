import { dbClient } from "../libs";

export const findAllAdmins = async () => {
  try {
    const admins = await dbClient.person.findMany({
      where: {
        role: "ADMIN",
      },
    });
    return admins;
  } catch (error) {
    throw error;
  }
};

export const isSenderAdmin = async (userId: number) => {
  try {
    const user = await dbClient.person.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new Error("User not found.");
    }
    return user.role === "ADMIN";
  } catch (error) {
    throw error;
  }
};

export const getAdminList = async () => {
  try {
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
  } catch (error) {
    throw error;
  }
};

export const addGlobalAdmin = async (name: string, id: number) => {
  try {
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
  } catch (error) {
    throw error;
  }
};

export const removeGlobalAdmin = async (id: number) => {
  try {
    await dbClient.person.delete({
      where: { id },
    });
  } catch (error) {
    throw error;
  }
};
