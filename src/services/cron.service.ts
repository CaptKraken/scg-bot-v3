import cron from "node-cron";
import {
  errorHandler,
  getToday,
  dbClient,
  sendMessage,
} from "../libs/index.lib";
import {
  increaseDayCount,
  deleteManySkips,
  findSkips,
  sendReport,
} from "./index.service";

/**
 * creates cron jobs.
 */
export const createCronJobs = async () => {
  const all = await dbClient.dayCount
    .findMany({
      select: {
        id: true,
        groupId: true,
        schedule: true,
      },
    })
    .then((dayCounts) => {
      return dayCounts.filter((dayCount) =>
        cron.validate(`${dayCount?.schedule}`)
      );
    });

  all.forEach(async (dc) => {
    cron.schedule(
      `${dc.schedule}`,
      async () => {
        try {
          const today = getToday();
          const skips = await findSkips(dc.id, today);

          if (skips.length > 0) {
            console.info(
              `[INFO: ${new Date().toLocaleString("km-KH")}] Day count ${
                dc.id
              } skipped.`
            );
            return await deleteManySkips(dc.id, today);
          }

          const data = await increaseDayCount(dc.id, 1);
          if (dc.id === Number(process.env.READING_GROUP_DAY_COUNT_ID)) {
            return sendReport();
          }

          const uncleanedMessage = data.message;
          const message = `${uncleanedMessage?.replace(
            /\{day_count}/g,
            `${data.dayCount}`
          )}`;

          sendMessage(data.groupId, message);
        } catch (error) {
          errorHandler(dc.groupId, error);
        }
      },
      {
        scheduled: false,
        timezone: "Asia/Phnom_Penh",
      }
    );
  });
  console.log(`[INFO]: ${cron.getTasks().size} jobs created.`);
};

/**
 * starts all cron jobs.
 */
export const startCronJobs = () => {
  cron.getTasks().forEach((job) => job.start());
  console.log(`[INFO]: ${cron.getTasks().size} jobs started.`);
};

/**
 * stops all cron jobs.
 */
export const stopCronJobs = () => {
  cron.getTasks().forEach((job) => job.stop());
  console.log(`[INFO]: ${cron.getTasks().size} jobs stopped.`);
  emptyNodeCronStorage();
};

/**
 * init cron jobs
 */
export const initCronJobs = async () => {
  await createCronJobs();
  startCronJobs();
};

/**
 * restart cron jobs
 */
export const restartCronJobs = async () => {
  console.log(`******* Restarting Cron Jobs *******`);
  stopCronJobs();
  await initCronJobs();
  console.log(`********* Restarting Done **********`);
};

/**
 * specifically for node-cron.js!
 *
 * reset cron.getTasks()
 *
 */
export const emptyNodeCronStorage = () => {
  // looked into the source code for this.
  // @ts-ignore
  global.scheduledTasks = new Map();
};
