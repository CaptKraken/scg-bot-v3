import cron from "node-cron";
import { dbClient } from "../libs";
import { errorHandler, sendMessage } from "../libs/utils";
import { findAllDayCounts, increaseDayCount } from "./day-count.service";
import { sendReport } from "./reader.service";

export const createCronJobs = async () => {
  const all = await dbClient.dayCount
    .findMany({
      select: {
        id: true,
        groupId: true,
        schedule: true,
        message: true,
        dayCount: true,
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
          const data = await increaseDayCount(dc.id);

          if (dc.id === Number(process.env.READING_GROUP_DAY_COUNT_ID)) {
            return sendReport();
          }

          const uncleanedMessage = data.message;
          const message = `${uncleanedMessage?.replaceAll(
            "{day_count}",
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
export const startCronJobs = () => {
  cron.getTasks().forEach((job) => job.start());
  console.log(`[INFO]: ${cron.getTasks().size} jobs started.`);
};

export const stopCronJobs = () => {
  cron.getTasks().forEach((job) => job.stop());
  console.log(`[INFO]: ${cron.getTasks().size} jobs stopped.`);
  emptyNodeCronStorage();
};

export const initCronJobs = async () => {
  await createCronJobs();
  startCronJobs();
};

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
