import { findOneUser } from "../services/user.service";

export const isSenderAdmin = async (userId: number) => {
  try {
    const user = await findOneUser(userId);
    return user?.role === "ADMIN";
  } catch (error) {
    return false;
  }
};

import axios from "axios";
import dotenv from "dotenv";
import { COMMANDS } from "./constants";
import { Prisma } from "@prisma/client";
dotenv.config();

const { BOT_TOKEN, BOT_USERNAME } = process.env;

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

type KhmerToArabicMap = {
  [key: string]: number;
};
type ArabicToKhmerMap = {
  [key: number]: string;
};

const numberMapKhmerToArabic: KhmerToArabicMap = {
  "០": 0,
  "១": 1,
  "២": 2,
  "៣": 3,
  "៤": 4,
  "៥": 5,
  "៦": 6,
  "៧": 7,
  "៨": 8,
  "៩": 9,
};
const numberMapArabicToKhmer: ArabicToKhmerMap = {
  0: "០",
  1: "១",
  2: "២",
  3: "៣",
  4: "៤",
  5: "៥",
  6: "៦",
  7: "៧",
  8: "៨",
  9: "៩",
};

/**
 * converts khmer numerals to arabic
 * @param {string} value - i.e. "១២"​, "12", "១២52"
 * @returns string; formatted arabic numerals or the original value
 */
export const convertKhmerToArabicNumerals = (value: number | string) => {
  if (typeof value === "number") {
    return value;
  }
  let splited = value.split("");
  for (const [index, val] of splited.entries()) {
    const isArabicNumber = numberMapArabicToKhmer[Number(val)];
    if (isArabicNumber) {
      // skip
      continue;
    }

    const currentNumber = numberMapKhmerToArabic[val]; // khmer numeral
    if (currentNumber || currentNumber === 0) {
      // replace it with the arabic numeral
      splited[index] = currentNumber.toString();
    } else {
      // if the value wasn't found in the number maps, remove the value of splited array.
      delete splited[index];
      //   return value;
    }
  }
  return parseInt(splited.join(""));
};

/**
 * checks if string is a number
 * @param {string} value - i.e. "១២"​, "12", "១២52", "១z២52"
 * @returns boolean
 */
export const isNumber = (value: string) =>
  Number(convertKhmerToArabicNumerals(value)).toString() !== "NaN";

export const cleanMessage = (message: string) => {
  const ch = [
    "_",
    "*",
    "[",
    "]",
    "(",
    ")",
    "~",
    "`",
    ">",
    "#",
    "+",
    "-",
    "=",
    "|",
    "{",
    "}",
    ".",
    "!",
  ];
  return message
    .split("")
    .map((str) => {
      if (str === ".") {
        return "";
      }
      if (ch.includes(str)) {
        return `\\${str}`;
      }
      return str;
    })
    .join("");
};

export const sendMessage = async (
  chat_id: number,
  message: string,
  parse_mode?: "MarkdownV2" | "html" | "Markdown"
): Promise<any | undefined> => {
  if (!chat_id || !message) return;
  try {
    const payload: {
      chat_id: number;
      text: string;
      parse_mode?: string;
    } = {
      chat_id,
      text: message,
    };

    if (parse_mode) {
      payload["parse_mode"] = parse_mode;
    }

    const res = await axios.post(`${TELEGRAM_API}/sendMessage`, payload);
    if (res.data.ok) {
      return res.data.result;
    }
  } catch (err) {
    throw new Error(
      `function: "sendMessage"\nchat_id: ${chat_id}\nmessage: ${message}\n${err}`
    );
  }
};

export const errorHandler = async (group_id: number, e: unknown) => {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      return sendDisappearingErrorMessage(
        group_id,
        `${
          e.meta?.target
            ? //@ts-ignore
              `Duplication Error: ${e.meta?.target[0]} `
            : "Duplication Error."
        }`
      );
    }
    if (e.code === "P2003") {
      return sendDisappearingErrorMessage(
        group_id,
        `${
          e.meta?.target
            ? //@ts-ignore
              `Duplication Error: ${e.meta?.target[0]} `
            : "Duplication Error."
        }`
      );
    }
    if (e.code === "P2025") {
      return sendDisappearingErrorMessage(
        group_id,
        `${e.meta?.cause ?? "Record not found."}`
      );
    }
  }

  if (e instanceof Error) {
    const message = e.message;

    if (message.includes(`INVALID SCHEDULE`)) {
      return sendDisappearingErrorMessage(
        group_id,
        `Invalid schedule expression received.`
      );
    }
    return sendDisappearingErrorMessage(group_id, `${message}`);
  }
};

export const sendDisappearingErrorMessage = async (
  group_id: number,
  message: string,
  durationInSeconds?: number
) => {
  await sendDisappearingMessage(
    group_id,
    `[Error]: ${message}`,
    durationInSeconds
  );
};

export const deleteMessage = async (chat_id: number, message_id: number) => {
  if (!chat_id || !message_id) return;
  try {
    const res = await axios.post(`${TELEGRAM_API}/deleteMessage`, {
      chat_id,
      message_id,
    });
    if (res.data.ok) {
      return res.data.result;
    }
  } catch (err) {
    console.error(err);
  }
};

export const sendDisappearingMessage = async (
  group_id: number,
  message: string,
  durationInSeconds: number = 5
) => {
  const res = await sendMessage(
    group_id,
    `${message}\n_This message will be automatically deleted in ${durationInSeconds} seconds_`,
    "Markdown"
  );

  setTimeout(async () => {
    deleteMessage(group_id, res.message_id);
  }, durationInSeconds * 1000);
};

export const cancelKey = [
  {
    text: "Cancel",
    callback_data: "cancel",
  },
];
export const goBackBroadcastKey = [
  { text: "Go Back", callback_data: COMMANDS.BROADCAST_BACK_ACTION },
];

export const getSetGroupResult = (message: string) => {
  const flags = message.split(" -");
  type Result = {
    id?: number;
    message?: string;
    dayCount?: number;
    schedule?: string;
  };
  const result: Result = {
    message: undefined,
    dayCount: undefined,
    schedule: undefined,
  };
  flags
    .map((flag) => flag.trim())
    .forEach((flag) => {
      if (flag.startsWith("m ")) {
        const message = flag
          .replace("m ", "")
          .trim()
          .replace(/"/g, "")
          .replace(/'/g, "");
        if (message) {
          result.message = message;
        }
      }
      if (flag.startsWith("d ")) {
        const number = flag.replace("d ", "");
        if (number) {
          result.dayCount = parseInt(number);
        }
      }
      if (flag.startsWith("id ")) {
        const number = flag.replace("id ", "");
        if (number) {
          result.id = parseInt(number);
        }
      }
      if (flag.startsWith("s ")) {
        const schedule = flag
          .replace("s ", "")
          .trim()
          .replace(/"/g, "")
          .replace(/'/g, "");
        result.schedule = schedule;
      }
    });

  return result;
};

export const csvToTable = (
  data: string,
  delimiter: string = ",",
  hasHeaders: boolean = false
) => {
  const rows: string[][] = data.split("\n").map((row) => row.split(delimiter));
  let numOfCol = 0;
  const spaceForCol: number[] = [];
  rows.map((cells, i) => {
    if (numOfCol < cells.length) {
      numOfCol = cells.length;
    }
    cells.map((cell, j) => {
      if (i === 0 || Number(spaceForCol[j]) < cell.length) {
        spaceForCol[j] = cell.length;
      }
    });
  });

  const table = rows.map((cells) => {
    return cells
      .map((cell, i) => {
        return " " + cell.padEnd(spaceForCol[i]) + " ";
      })
      .join("|");
  });

  if (hasHeaders) {
    table.splice(
      1,
      0,
      Array(numOfCol)
        .fill("-")
        .map((_, i) => "".padStart(spaceForCol[i] + 2, "-")) // 2 for space (table loop)
        .join("|")
    );
  }

  return table.join("\n");
};

export const removeCommand = (message?: string) => {
  if (!message) return "";
  const trimmedMessage = message.trim();

  if (!trimmedMessage) return "";
  let result = trimmedMessage;

  const commands = Object.values(COMMANDS);
  commands.map((command) => {
    const isMatchCommand = trimmedMessage?.startsWith("/" + command);
    const isMatchAction =
      trimmedMessage?.startsWith(command) &&
      trimmedMessage?.includes("-action");

    if (isMatchCommand) {
      result = trimmedMessage
        ?.replace(`/${command}@${BOT_USERNAME}`, "")
        ?.replace("/" + command, "");
    }
    if (isMatchAction) {
      result = trimmedMessage?.replace(command, "");
    }
  });

  return result;
};
