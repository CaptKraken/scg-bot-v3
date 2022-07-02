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
  errorHandler,
  isSenderAdmin,
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
import { addQuoteCommand, removeQuoteCommand } from "./commands/quote.command";
import {
  formatMiddleware,
  isAdminMiddleware,
} from "./middlewares/bot.middleware";
import {
  removeGroupCommand,
  setGroupCommand,
} from "./commands/day-count.command";
import { createFolder, renameFolder } from "./services/folder.service";
import {
  addGroupBroadcastCommand,
  createFolderCommand,
  deleteFolderCommand,
  emitBroadcastCommand,
  removeGroupBroadcastCommand,
  renameFolderCommand,
} from "./commands/broadcast.command";
import {
  addGroupBroadcastAction,
  cancelAction,
  deleteFolderAction,
  emitBroadcastAction,
  goBackBroadcastAction,
  removeGroupBroadcastAction,
  showRemoveGroupBroadcastAction,
} from "./actions/broadcast.action";
import { sendCommands } from "./commands/help.command";
dotenv.config();

const { BOT_TOKEN, SERVER_URL } = process.env;

export interface MyContext extends Context {
  senderId: number;
  chatId: number;
  isGroup: boolean;
  isAdmin: boolean;
}

const bot = new Telegraf<MyContext>(BOT_TOKEN as string);

bot.use(formatMiddleware);
bot.start(async (ctx) => {
  const username = ctx.from.first_name;
  await ctx.reply(`what's up, ${username}.`);
  console.log(ctx.isGroup, ctx.chatId);
});
bot.help(sendCommands);

bot.hears(/\#\d{1,}/g, (ctx) => updateReadCountCommand(ctx));
bot.on("edited_message", (ctx) => updateReadCountCommand(ctx, false));

bot.use(isAdminMiddleware);
bot.command(COMMANDS.removeReader, removeReaderCommand);
bot.command(COMMANDS.readReport, readReportCommand);

bot.command(COMMANDS.setGroup, setGroupCommand);
bot.command(COMMANDS.removeGroup, removeGroupCommand);

bot.command(COMMANDS.admins, sendAdminListCommand);
bot.command(COMMANDS.addGlobalAdmin, addGlobalAdminCommand);
bot.command(COMMANDS.removeGlobalAdmin, removeGlobalAdminCommand);

//#region Quote
bot.command(COMMANDS.addQuote, addQuoteCommand);
bot.command(COMMANDS.removeQuote, removeQuoteCommand);
//#endregion

bot.command(COMMANDS.createFolder, createFolderCommand);
bot.command(COMMANDS.renameFolder, renameFolderCommand);
bot.command(COMMANDS.deleteFolder, deleteFolderCommand);
bot.action(/\bdelete-folder-action\b/g, deleteFolderAction);
bot.command(COMMANDS.addGroupBroadcast, addGroupBroadcastCommand);
bot.action(/\badd-group-broadcast-action\b/g, addGroupBroadcastAction);
bot.command(COMMANDS.removeGroupBroadcast, removeGroupBroadcastCommand);
bot.action(
  /\bshow-remove-group-broadcast-action\b/g,
  showRemoveGroupBroadcastAction
);
bot.action(/\bremove-group-broadcast-action\b/g, removeGroupBroadcastAction);
bot.action(/\bgo-back-broadcast-action\b/g, goBackBroadcastAction);
bot.action(/\bcancel\b/g, cancelAction);
bot.command(COMMANDS.emit, emitBroadcastCommand);
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
