import { dbClient } from "../libs";

export const findAllUser = async (withReaderProfile: boolean = false) => {
  try {
    const users = await dbClient.person.findMany({
      include: {
        readerInfo: withReaderProfile,
      },
    });
    return users;
  } catch (error) {
    throw error;
  }
};

export const createUser = async (
  id: number,
  name: string,
  withReaderProfile: boolean = false
) => {
  try {
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
        role: "USER",
      },
      include: {
        readerInfo: withReaderProfile,
      },
    });
    if (!user) {
      throw new Error("Failed to create user.");
    }
    return user;
  } catch (error) {
    throw error;
  }
};
