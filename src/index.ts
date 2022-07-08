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
  addGlobalAdminCommand,
  removeGlobalAdminCommand,
  sendAdminListCommand,
} from "./commands/admin.command";
import {
  readReportCommand,
  removeReaderCommand,
  updateReadCountCommand,
} from "./commands/read.command";
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
  isValidDate,
  listDayCountCommand,
  removeGroupCommand,
  setGroupCommand,
  skipDayCountCommand,
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
  addGroupToFolderAction,
  cancelAction,
  deleteFolderAction,
  emitBroadcastAction,
  goBackBroadcastAction,
  deleteGroupFromFolderAction,
  listGroupsOfFolderAction,
} from "./actions/broadcast.action";
import {
  infoCommand,
  startCommand,
  helpCommand,
  checkCommand,
} from "./commands/misc.command";
dotenv.config();

const { BOT_TOKEN, SERVER_URL } = process.env;

// TODO: IMPLIMENT SKIP FUNCTION
// TODO: CRON JOB INCREASE 1 PER DAY, NOT EVERY JOB.
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
bot.start(startCommand);
bot.help(helpCommand);
bot.command(COMMANDS.INFO, infoCommand);

//#region Read create+update
bot.hears(/\#\d{1,}/g, (ctx) => updateReadCountCommand(ctx));
bot.on("edited_message", (ctx) => updateReadCountCommand(ctx, false));
//#endregion

bot.use(isAdminMiddleware);
bot.command(COMMANDS.CHECK, checkCommand);
bot.command(COMMANDS.DAY_SKIP, skipDayCountCommand);
//#region Read delete+read report
bot.command(COMMANDS.READER_DELETE, removeReaderCommand);
bot.command(COMMANDS.READER_LIST, readReportCommand);
//#endregion

//#region Day Count
bot.command(COMMANDS.DC_NEW, setGroupCommand);
bot.command(COMMANDS.DC_EDIT, updateGroupCommand);
bot.command(COMMANDS.DC_DELETE, removeGroupCommand);
bot.command(COMMANDS.DC_LIST, listDayCountCommand);
//#endregion

//#region Admins
bot.command(COMMANDS.ADMIN_LIST, sendAdminListCommand);
bot.command(COMMANDS.ADMIN_NEW, addGlobalAdminCommand);
bot.command(COMMANDS.ADMIN_DELETE, removeGlobalAdminCommand);
//#endregion

//#region Quote
bot.command(COMMANDS.QUOTE_NEW, addQuoteCommand);
bot.command(COMMANDS.QUOTE_LIST, viewQuoteCommand);
bot.command(COMMANDS.QUOTE_DELETE, removeQuoteCommand);
//#endregion

//#region Broadcast
bot.command(COMMANDS.FOLDER_NEW, createFolderCommand);
bot.command(COMMANDS.FOLDER_EDIT, renameFolderCommand);
bot.command(COMMANDS.FOLDER_DELETE, deleteFolderCommand);
bot.action(/\bdelete-folder-action\b/g, deleteFolderAction);
bot.command(COMMANDS.GROUP_NEW, addGroupBroadcastCommand);
bot.action(/\badd-group-broadcast-action\b/g, addGroupToFolderAction);
bot.command(COMMANDS.GROUP_DELETE, removeGroupBroadcastCommand);
bot.action(/\bshow-remove-group-broadcast-action\b/g, listGroupsOfFolderAction);
bot.action(/\bremove-group-broadcast-action\b/g, deleteGroupFromFolderAction);
bot.action(/\bgo-back-broadcast-action\b/g, goBackBroadcastAction);
bot.action(/\bcancel\b/g, cancelAction);
bot.command(COMMANDS.EMIT, emitBroadcastCommand);
bot.action(/\bemit\b/g, emitBroadcastAction);
//#endregion

bot.telegram.setWebhook(`${SERVER_URL}/bot${BOT_TOKEN}`);
const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));
export const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

app.get("/", (req: Request, res: Response) => {
  return res.json({ alive: true, uptime: process.uptime() });
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
