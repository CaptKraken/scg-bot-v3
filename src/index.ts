import { Context, Telegraf } from "telegraf";
import { Update } from "typegram";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { initCronJobs } from "./services/cron.service";
import { debug } from "util";
import { COMMANDS } from "./libs/constants";
import {
  cleanMessage,
  csvToTable,
  errorHandler,
  isSenderAdmin,
  removeCommand,
  sendDisappearingMessage,
  sendMessage,
} from "./libs/utils";
import { getAdminList } from "./services/admin.service";
import {
  addGlobalAdminCommand,
  removeGlobalAdminCommand,
  sendAdminListCommand,
} from "./commands/admin.command";
import {
  readReportCommand,
  removeReaderCommand,
  updateReadCountCommand,
} from "./commands/read.command";
import { createDayCount, increaseDayCount } from "./services/day-count.service";
import { createGroup } from "./services/group.service";
import { sendReport } from "./services/reader.service";
import {
  addQuoteCommand,
  removeQuoteCommand,
  viewQuoteCommand,
} from "./commands/quote.command";
import {
  formatMiddleware,
  isAdminMiddleware,
} from "./middlewares/bot.middleware";
import {
  listDayCountCommand,
  removeGroupCommand,
  setGroupCommand,
  updateGroupCommand,
} from "./commands/day-count.command";
import {
  addGroupBroadcastCommand,
  createFolderCommand,
  deleteFolderCommand,
  emitBroadcastCommand,
  removeGroupBroadcastCommand,
  renameFolderCommand,
} from "./commands/broadcast.command";
import {
  GROUP_NEW_ACTION,
  cancelAction,
  FOLDER_DELETE_ACTION,
  emitBroadcastAction,
  BROADCAST_BACK_ACTION,
  GROUP_DELETE_ACTION,
  GROUP_LIST_DELETE_ACTION,
} from "./actions/broadcast.action";
import { sendCommands } from "./commands/help.command";
import { dbClient } from "./libs";
dotenv.config();

const { BOT_TOKEN, SERVER_URL } = process.env;

export interface MyContext extends Context {
  senderId: number;
  chatId: number;
  isGroup: boolean;
  isAdmin: boolean;
  cleanedMessage: string;
  cleanedCallback: string;
}

const bot = new Telegraf<MyContext>(BOT_TOKEN as string);

bot.use(formatMiddleware);
bot.start(async (ctx) => {
  const username = ctx.from.first_name;
  await ctx.reply(`what's up, ${username}.`);
});
bot.help(sendCommands);

bot.hears(/\#\d{1,}/g, (ctx) => updateReadCountCommand(ctx));
bot.on("edited_message", (ctx) => updateReadCountCommand(ctx, false));

bot.use(isAdminMiddleware);
bot.command(COMMANDS.READER_DELETE, removeReaderCommand);
bot.command(COMMANDS.READER_LIST, readReportCommand);

bot.command(COMMANDS.DC_NEW, setGroupCommand);
bot.command(COMMANDS.DC_EDIT, updateGroupCommand);
bot.command(COMMANDS.DC_DELETE, removeGroupCommand);
bot.command(COMMANDS.DC_LIST, listDayCountCommand);

bot.command(COMMANDS.ADMIN_LIST, sendAdminListCommand);
bot.command(COMMANDS.ADMIN_NEW, addGlobalAdminCommand);
bot.command(COMMANDS.ADMIN_DELETE, removeGlobalAdminCommand);

//#region Quote
bot.command(COMMANDS.QUOTE_NEW, addQuoteCommand);
bot.command(COMMANDS.QUOTE_LIST, viewQuoteCommand);
bot.command(COMMANDS.QUOTE_DELETE, removeQuoteCommand);
//#endregion

bot.command(COMMANDS.FOLDER_NEW, createFolderCommand);
bot.command(COMMANDS.FOLDER_EDIT, renameFolderCommand);
bot.command(COMMANDS.FOLDER_DELETE, deleteFolderCommand);
bot.action(/\bdelete-folder-action\b/g, FOLDER_DELETE_ACTION);
bot.command(COMMANDS.GROUP_NEW, addGroupBroadcastCommand);
bot.action(/\badd-group-broadcast-action\b/g, GROUP_NEW_ACTION);
bot.command(COMMANDS.GROUP_DELETE, removeGroupBroadcastCommand);
bot.action(/\bshow-remove-group-broadcast-action\b/g, GROUP_LIST_DELETE_ACTION);
bot.action(/\bremove-group-broadcast-action\b/g, GROUP_DELETE_ACTION);
bot.action(/\bgo-back-broadcast-action\b/g, BROADCAST_BACK_ACTION);
bot.action(/\bcancel\b/g, cancelAction);
bot.command(COMMANDS.EMIT, emitBroadcastCommand);
bot.action(/\bemit\b/g, emitBroadcastAction);
bot.telegram.setWebhook(`${SERVER_URL}/bot${BOT_TOKEN}`);
const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));
export const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

app.get("/", (req: Request, res: Response) => {
  res.json({ alive: true, uptime: process.uptime() });
});

const server = app.listen(process.env.PORT || 3000, async () => {
  console.log(`[INFO]: App running on port ${process.env.PORT || 3000}`);
  console.log(`************* INIT BOT *************`);
  await initCronJobs();
  console.log(`************ INIT  DONE ************`);
});

process.on("SIGTERM", () => {
  debug("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    debug("HTTP server closed");
  });
});
