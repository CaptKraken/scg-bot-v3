import { MyContext } from "../index";
import { COMMAND_GROUPS, cleanMessage, errorHandler } from "../libs/index.lib";
import dotenv from "dotenv";
dotenv.config();

const {
  SERVER_URL,
  BOT_TOKEN,
  BOT_USERNAME,
  CONNECTION_STRING,
  READING_GROUP_ID,
  READING_GROUP_DAY_COUNT_ID,
} = process.env;

interface ValidUrlOptions {
  isSecure?: boolean;
}

const isUrlValid = (url: string | undefined, options?: ValidUrlOptions) => {
  if (!url) return false;
  try {
    const urlObject = new URL(url);
    if (options?.isSecure) {
      return urlObject.protocol === "https:";
    }
    return urlObject.protocol === "https:" || urlObject.protocol === "http:";
  } catch (error) {
    return false;
  }
};

// regex from https://www.regextester.com/108794
const botTokenRegex = new RegExp(/[0-9]{9}:[a-zA-Z0-9_-]{35}/gm);
const postgresqlRegex = new RegExp(
  /postgresql:\/\/(?:(?:[^:]+):(?:[^@]+)?@)?(?:(?:(?:[^\/]+)|(?:\/.+.sock?),?)+)(?:\/([^\/\.\ "*<>:\|\?]*))?(?:\?(?:(.+=.+)&?)+)*/
);

const isUrlConnectionStringValid = (connectionString: string | undefined) => {
  if (!connectionString) return false;
  return connectionString.match(postgresqlRegex)?.some((cs) => cs) || false;
};

const isTelegramBotTokenValid = (token: string | undefined) => {
  if (!token) return false;
  return token.match(botTokenRegex)?.some((t) => t) || false;
};

export const checkEnvironmentVariables = () => {
  const envionmentVariables: {
    [key: string]: boolean;
  } = {
    isServerUrlValid: isUrlValid(SERVER_URL, { isSecure: true }),
    isBotTokenValid: isTelegramBotTokenValid(BOT_TOKEN),
    botUsernameExists: Boolean(BOT_USERNAME),
    isConnectionStringValid: isUrlConnectionStringValid(CONNECTION_STRING),
    botReadingGroupIdExists: !isNaN(Number(READING_GROUP_ID)),
    botReadingDayCountIdExists: !isNaN(Number(READING_GROUP_DAY_COUNT_ID)),
  };

  const keys = Object.keys(envionmentVariables);
  const areEVsConfigured = keys.every((key) => envionmentVariables[key]);

  const invalidEVs = [];
  if (!areEVsConfigured) {
    invalidEVs.push(
      ...keys.filter((key) => envionmentVariables[key] === false)
    );
  }

  return {
    valid: areEVsConfigured,
    invalidEVs,
  };
};

/**
 * Checks environment variables, says hi, sends help command.
 */
export const startCommand = async (ctx: MyContext) => {
  if (!checkEnvironmentVariables().valid) {
    ctx.reply(
      "⚠️ *បញ្ហា* ⚠️\n*Envionment Variables* មិនទាន់បានរៀបចំត្រឹមត្រូវទេ។\nសូមប្រើ */check* ដើម្បីចូលមើលការខ្វះខាត។",
      {
        parse_mode: "MarkdownV2",
      }
    );
  }

  const username = ctx.from?.first_name;
  ctx.reply(`សួរស្ដី ${username}!`);
  return helpCommand(ctx);
};

/**
 * Checks required evironment variables
 */
export const checkCommand = async (ctx: MyContext) => {
  const { valid, invalidEVs } = checkEnvironmentVariables();

  if (valid) {
    return ctx.reply("✅ Evironment variables បានរៀបចំត្រឹមត្រូវ។");
  }

  let message = "⛔️ មាន enviroment variables ខ្លះមិនបានរៀបចំត្រឹមត្រូវ៖";

  const keyToEVKey: {
    [key: string]: string;
  } = {
    isServerUrlValid: "SERVER_URL",
    isBotTokenValid: "BOT_TOKEN",
    botUsernameExists: "BOT_USERNAME",
    isConnectionStringValid: "CONNECTION_STRING",
    botReadingGroupIdExists: "READING_GROUP_ID",
    botReadingDayCountIdExists: "READING_GROUP_DAY_COUNT_ID",
  };

  invalidEVs.map((invalidEv, index) => {
    message += `\n<b>${index + 1} - ${keyToEVKey[invalidEv]}</b>`;
  });

  return ctx.reply(message, { parse_mode: "HTML" });
};

/**
 * Sends a list of all commands with usage guide.
 */
export const helpCommand = async (ctx: MyContext) => {
  try {
    let commands = "";

    COMMAND_GROUPS.map((group) => {
      commands += `\n*__${group.name}__*\n`;
      group.commands.map((command) => {
        commands += `${cleanMessage(command)}\n`;
      });
    });

    return await ctx.reply(commands, {
      parse_mode: "MarkdownV2",
    });
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};

/**
 * Sends info of user or group
 */
export const infoCommand = async (ctx: MyContext) => {
  if (ctx.cleanedMessage.includes("-g")) {
    const chat = await ctx.getChat();
    return await ctx.reply(
      //@ts-ignore
      `*Group Info:*\n*ID:* ${chat.id}\n*Name:* ${chat.title}`,
      { parse_mode: "Markdown" }
    );
  }
  return ctx.reply(
    `\n*Your Info:*\n*ID:* ${ctx.from?.id}\n*Name:* ${ctx.from?.first_name} ${ctx.from?.last_name}\n*Username:* @${ctx.from?.username}`,
    {
      parse_mode: "Markdown",
    }
  );
};
