import { MyContext } from "../index";
import { COMMANDS, COMMAND_GROUPS } from "../libs/constants";
import { cleanMessage, errorHandler } from "../libs/utils";

export const sendCommands = async (ctx: MyContext) => {
  try {
    // const commands = `Available Commands:\n\n*** Day Count ***\n/${COMMANDS.DC_NEW} -d 1 -s "0 5 * * *" -m "whatever {day_count} you want." — set/update day count group.\n/${COMMANDS.DC_DELETE} — remove day count.\n\n*** Broadcast ***\n/${COMMANDS.FOLDER_NEW} folder name — create a new folder.\n/${COMMANDS.FOLDER_EDIT} -o old name -n new name — rename a folder.\n/${COMMANDS.FOLDER_DELETE} — delete a folder and its content.\n/${COMMANDS.GROUP_NEW} — add current group to a folder.\n/${COMMANDS.GROUP_DELETE} — remove current group from a folder.\n/${COMMANDS.emit} message here — mass send message to a folder group.\n\n*** Reading Group ***\n/${COMMANDS.READER_DELETE} reader name — remove reader from reading group.\n/${COMMANDS.READER_LIST} — send report to the reading group.\n\n*** Admins ***\n/${COMMANDS.ADMIN_LIST} — send admin list.\n/${COMMANDS.ADMIN_NEW} {reply} — add user as global admin.\n/${COMMANDS.ADMIN_DELETE} {reply} — remove user from admin database.\n\n*** Quotes ***\n/${COMMANDS.QUOTE_NEW} — add a new quote.\n/${COMMANDS.QUOTE_DELETE} — remove a quote.`;

    let commands = "";

    COMMAND_GROUPS.map((group) => {
      commands += `\n*__${group.name}__*\n`;
      group.commands.map((command) => {
        commands += `${cleanMessage(command)}\n`;
      });
    });

    await ctx.reply(commands, {
      parse_mode: "MarkdownV2",
    });
  } catch (error) {
    errorHandler(ctx.chatId, error);
  }
};
