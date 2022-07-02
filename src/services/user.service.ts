import { dbClient } from "../libs";

export const findAllUser = async (withReaderProfile: boolean = false) => {
  const users = await dbClient.person.findMany({
    include: {
      readerInfo: withReaderProfile,
    },
  });
  return users;
};

export const findOneUser = async (
  id: number,
  withReaderProfile: boolean = false
) => {
  const user = await dbClient.person.findUnique({
    where: { id },
    include: {
      readerInfo: withReaderProfile,
    },
  });

  if (!user) throw new Error(`User ${id} not found.`);
  return user;
};

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
  if (!user) {
    throw new Error("Failed to create user.");
  }
  return user;
};

export const deleteUser = async (id: number) => {
  await dbClient.person.delete({
    where: { id },
  });
};
