import { dbClient } from "../libs";

export const findAllGroups = async () => {
  return await dbClient.group.findMany();
};
