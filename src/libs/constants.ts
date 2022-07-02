export const COMMANDS = {
  setGroup: "setGroup",
  removeGroup: "removeGroup",
  setCount: "setCount",
  setSchedule: "setSchedule",
  setAdmin: "setAdmin",
  removeAdmin: "removeAdmin",
  addAdminAnnounce: "addAdminAnnounce",
  addGroupAnnounce: "addGroupAnnounce",
  removeAdminAnnounce: "removeAdminAnnounce",
  removeGroupAnnounce: "removeGroupAnnounce",
  emit: "emit",
  removeAdminAction: "remove-admin-action",
  removeGroupAction: "remove-group-action",
  removeWeight: "removeWeight",
  createFolder: "createFolder",
  renameFolder: "renameFolder",
  deleteFolder: "deleteFolder",
  renameFolderAction: "rename-folder-action",
  deleteFolderAction: "delete-folder-action",
  addGroupBroadcast: "addGroupBroadcast",
  addGroupBroadcastAction: "add-group-broadcast-action",
  removeGroupBroadcast: "removeGroupBroadcast",
  removeGroupBroadcastAction: "remove-group-broadcast-action",
  showRemoveGroupBroadcastAction: "show-remove-group-broadcast-action",
  goBackBroadcastAction: "go-back-broadcast-action",
  admins: "admins",
  addGlobalAdmin: "addGlobalAdmin",
  removeGlobalAdmin: "removeGlobalAdmin",
  removeReader: "removeReader",
  readReport: "readReport",
  addQuote: "addQuote",
  removeQuote: "removeQuote",
};
const dayCountCommands = {
  name: "Day Count",
  commands: [
    `/${COMMANDS.setGroup} -d 1 -s "0 5 * * *" -m "whatever {day_count} you want." — set/update day count group.`,
    `/${COMMANDS.removeGroup} — remove day count.`,
  ],
};
const broadcastCommands = {
  name: "Broadcast",
  commands: [
    `/${COMMANDS.createFolder} folder name — create a new folder.`,
    `/${COMMANDS.renameFolder} -o old name -n new name — rename a folder.`,
    `/${COMMANDS.deleteFolder} — delete a folder and its content.`,
    `/${COMMANDS.addGroupBroadcast} — add current group to a folder.`,
    `/${COMMANDS.removeGroupBroadcast} — remove current group from a folder.`,
    `/${COMMANDS.emit} message here — mass send message to a folder group.`,
  ],
};
const readingGroupCommands = {
  name: "Reading Group",
  commands: [
    `/${COMMANDS.removeReader} reader name — remove reader from reading group.`,
    `/${COMMANDS.readReport} — send report to the reading group.`,
  ],
};
const adminCommands = {
  name: "Admins",
  commands: [
    `/${COMMANDS.admins} — send admin list.`,
    `/${COMMANDS.addGlobalAdmin} {reply} — add user as global admin.`,
    `/${COMMANDS.removeGlobalAdmin} {reply} — remove user from admin database.`,
  ],
};
const quoteCommands = {
  name: "Quotes",
  commands: [
    `/${COMMANDS.addQuote} — add a new quote.`,
    `/${COMMANDS.removeQuote} — remove a quote.`,
  ],
};
export const COMMAND_GROUPS = [
  dayCountCommands,
  broadcastCommands,
  readingGroupCommands,
  adminCommands,
  quoteCommands,
];
