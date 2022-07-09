export const COMMANDS = {
  // MISCELLANEOUS //
  /** "info" */
  INFO: "info",
  /** "check" */
  CHECK: "check",

  // DAY COUNT //
  /** "newdc" */
  DC_NEW: "newdc",
  /** "deletedc" */
  DC_DELETE: "deletedc",
  /** "editdc" */
  DC_EDIT: "editdc",
  /** "ctldc" */
  DC_CONTROL: "ctldc",
  /** "listdc" */
  DC_LIST: "listdc",
  /** "newskip" */
  SKIP_NEW: "newskip",
  /** "deleteskip" */
  SKIP_DELETE: "deleteskip",

  // ADMINS //
  /** "listadmins" */
  ADMIN_LIST: "listadmins",
  /** "newadmin" */
  ADMIN_NEW: "newadmin",
  /** "deleteadmin" */
  ADMIN_DELETE: "deleteadmin",

  // READERS //
  /** "deletereader" */
  READER_DELETE: "deletereader",
  /** "listreaders" */
  READER_LIST: "listreaders",

  // QUOTES //
  /** "newquote" */
  QUOTE_NEW: "newquote",
  /** "deletequote" */
  QUOTE_DELETE: "deletequote",
  /** "listquotes" */
  QUOTE_LIST: "listquotes",

  // BROADCAST //
  /** "emit" */
  EMIT: "emit",
  /** "emit" */
  EMIT_ACTION: "emit-action",
  /** "newfolder" */
  FOLDER_NEW: "newfolder",
  /** "editfolder" */
  FOLDER_EDIT: "editfolder",
  /** "deletefolder" */
  FOLDER_DELETE: "deletefolder",
  /** "delete-folder-action" */
  FOLDER_DELETE_ACTION: "delete-folder-action",
  /** "newgroup" */
  GROUP_NEW: "newgroup",
  /** "add-group-broadcast-action" */
  GROUP_NEW_ACTION: "add-group-broadcast-action",
  /** "deletegroup" */
  GROUP_DELETE: "deletegroup",
  /** "remove-group-broadcast-action" */
  GROUP_DELETE_ACTION: "remove-group-broadcast-action",
  /** "show-remove-group-broadcast-action" */
  GROUP_LIST_DELETE_ACTION: "show-remove-group-broadcast-action",
  /** "go-back-broadcast-action" */
  BROADCAST_BACK_ACTION: "go-back-broadcast-action",
};
export const dayCountCommands = {
  name: "Day Count",
  commands: [
    `/${COMMANDS.DC_NEW} -d 1 -s "0 5 * * *" -m "whatever {day_count} you want." — create new day count record for the group.`,
    `/${COMMANDS.DC_EDIT} -id 1 -d 1 -s "0 5 * * *" -m "whatever {day_count} you want." — update day count with the given id.`,
    `/${COMMANDS.DC_DELETE} — remove day count.`,
    `/${COMMANDS.DC_LIST} - list all day count records of a group.`,
    `/${COMMANDS.SKIP_NEW} {-id 12 | -a | -g} -d? 1/2/2022 - list all day count records of a group.`,
  ],
};
export const broadcastCommands = {
  name: "Broadcast",
  commands: [
    `/${COMMANDS.FOLDER_NEW} folder name — create a new folder.`,
    `/${COMMANDS.FOLDER_EDIT} -o old name -n new name — rename a folder.`,
    `/${COMMANDS.FOLDER_DELETE} — delete a folder and its content.`,
    `/${COMMANDS.GROUP_NEW} — add current group to a folder.`,
    `/${COMMANDS.GROUP_DELETE} — remove current group from a folder.`,
    `/${COMMANDS.EMIT} message here — mass send message to a folder group.`,
  ],
};
export const readingGroupCommands = {
  name: "Reading Group",
  commands: [
    `/${COMMANDS.READER_DELETE} reader name — remove reader from reading group.`,
    `/${COMMANDS.READER_LIST} — send report to the reading group.`,
  ],
};
export const adminCommands = {
  name: "Admins",
  commands: [
    `/${COMMANDS.ADMIN_LIST} — send admin list.`,
    `/${COMMANDS.ADMIN_NEW} {reply} — add user as global admin.`,
    `/${COMMANDS.ADMIN_DELETE} {reply} — remove user from admin database.`,
  ],
};
export const quoteCommands = {
  name: "Quotes",
  commands: [
    `/${COMMANDS.QUOTE_NEW} — add a new quote.`,
    `/${COMMANDS.QUOTE_DELETE} — remove a quote.`,
  ],
};
export const COMMAND_GROUPS = [
  dayCountCommands,
  broadcastCommands,
  readingGroupCommands,
  adminCommands,
  quoteCommands,
];
