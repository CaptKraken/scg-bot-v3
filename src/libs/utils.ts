import { findOneUser } from "../services/user.service";

export const isSenderAdmin = async (userId: number) => {
  try {
    const user = await findOneUser(userId);
    return user.role === "ADMIN";
  } catch (error) {
    throw error;
  }
};
