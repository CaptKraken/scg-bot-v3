import { Context, Telegraf } from "telegraf";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { debug } from "util";
import { COMMANDS } from "./libs/index.lib";
import { initCronJobs } from "./services/index.service";
import {
  createAdminCommand,
  deleteAdminCommand,
  sendAdminListCommand,
  readReportCommand,
  removeReaderCommand,
  updateReadCountCommand,
  createQuoteCommand,
  deleteQuoteCommand,
  sendQuoteListCommand,
  deleteSkipDayCountCommand,
  listDayCountCommand,
  dayCountControlCommand,
  deleteDayCountCommand,
  createDayCountCommand,
  createSkipDayCountCommand,
  updateDayCountCommand,
  createGroupCommand,
  createFolderCommand,
  deleteFolderCommand,
  emitBroadcastCommand,
  deleteGroupCommand,
  renameFolderCommand,
  infoCommand,
  startCommand,
  helpCommand,
  checkCommand,
} from "./commands/index.command";

import {
  formatMiddleware,
  isAdminMiddleware,
} from "./middlewares/bot.middleware";
import {
  addGroupToFolderAction,
  cancelAction,
  deleteFolderAction,
  emitBroadcastAction,
  goBackBroadcastAction,
  deleteGroupFromFolderAction,
  listGroupsOfFolderAction,
} from "./actions/index.action";
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
// const bot = new Telegraf<MyContext>(BOT_TOKEN as string);

// bot.use(formatMiddleware);
// bot.start(startCommand);
// bot.help(helpCommand);
// bot.command(COMMANDS.INFO, infoCommand);

// //#region Read create+update
// bot.hears(/\#\d{1,}/g, (ctx) => updateReadCountCommand(ctx));
// bot.on("edited_message", (ctx) => updateReadCountCommand(ctx, false));
// //#endregion

// bot.use(isAdminMiddleware);
// bot.command(COMMANDS.CHECK, checkCommand);
// //#region Read delete+read report
// bot.command(COMMANDS.READER_DELETE, removeReaderCommand);
// bot.command(COMMANDS.READER_LIST, readReportCommand);
// //#endregion

// //#region Day Count
// bot.command(COMMANDS.DC_NEW, createDayCountCommand);
// bot.command(COMMANDS.DC_EDIT, updateDayCountCommand);
// bot.command(COMMANDS.DC_CONTROL, dayCountControlCommand);
// bot.command(COMMANDS.DC_DELETE, deleteDayCountCommand);
// bot.command(COMMANDS.DC_LIST, listDayCountCommand);
// bot.command(COMMANDS.SKIP_NEW, createSkipDayCountCommand);
// bot.command(COMMANDS.SKIP_DELETE, deleteSkipDayCountCommand);
// //#endregion

// //#region Admins
// bot.command(COMMANDS.ADMIN_LIST, sendAdminListCommand);
// bot.command(COMMANDS.ADMIN_NEW, createAdminCommand);
// bot.command(COMMANDS.ADMIN_DELETE, deleteAdminCommand);
// //#endregion

// //#region Quote
// bot.command(COMMANDS.QUOTE_NEW, createQuoteCommand);
// bot.command(COMMANDS.QUOTE_LIST, sendQuoteListCommand);
// bot.command(COMMANDS.QUOTE_DELETE, deleteQuoteCommand);
// //#endregion

// //#region Broadcast
// bot.command(COMMANDS.FOLDER_NEW, createFolderCommand);
// bot.command(COMMANDS.FOLDER_EDIT, renameFolderCommand);
// bot.command(COMMANDS.FOLDER_DELETE, deleteFolderCommand);
// bot.action(/\bdelete-folder-action\b/g, deleteFolderAction);
// bot.command(COMMANDS.GROUP_NEW, createGroupCommand);
// bot.action(/\badd-group-broadcast-action\b/g, addGroupToFolderAction);
// bot.command(COMMANDS.GROUP_DELETE, deleteGroupCommand);
// bot.action(/\bshow-remove-group-broadcast-action\b/g, listGroupsOfFolderAction);
// bot.action(/\bremove-group-broadcast-action\b/g, deleteGroupFromFolderAction);
// bot.action(/\bgo-back-broadcast-action\b/g, goBackBroadcastAction);
// bot.action(/\bcancel\b/g, cancelAction);
// bot.command(COMMANDS.EMIT, emitBroadcastCommand);
// bot.action(/\bemit\b/g, emitBroadcastAction);
// //#endregion

// bot.telegram.setWebhook(`${SERVER_URL}/bot${BOT_TOKEN}`);
const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
// app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));
export const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

app.get("/", (_: Request, res: Response) => {
  return res.json({ alive: true, uptime: process.uptime() });
});

// // keeps the heroku app running
setInterval(() => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`The script uses approximately ${used} MB`);
  console.log(process.memoryUsage());

  //   try {
  //     axiosClient.get("/");
  //   } catch (e) {
  //     // ts-ignore
  //     console.log("[KEEP ALIVE ERROR]:", `Error fetching the thing.`);
  //   }
}, 5000); // every 10 minutes

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
