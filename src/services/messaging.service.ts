import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const { BOT_TOKEN } = process.env;

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export const sendMessage = async (
  chat_id: number,
  message: string
): Promise<any | undefined> => {
  if (!chat_id || !message) return;
  try {
    const res = await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id,
      text: message,
    });
    if (res.data.ok) {
      return res.data.result;
    }
  } catch (err) {
    throw new Error(
      `function: "sendMessage"\nchat_id: ${chat_id}\nmessage: ${message}\n${err}`
    );
  }
};
