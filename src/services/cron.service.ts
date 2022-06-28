import cron from "node-cron";
import { dbClient } from "../libs";
import { findAllDayCounts, increaseDayCount } from "./day-count.service";
import { sendMessage } from "./messaging.service";

export const createCronJobs = async () => {
  const all = await dbClient.dayCount
    .findMany({
      select: {
        id: true,
        schedule: true,
      },
    })
    .then((dayCounts) => {
      return dayCounts.filter((dayCount) => cron.validate(dayCount.schedule));
    });

  all.forEach(async (dc) => {
    cron.schedule(
      dc.schedule,
      async () => {
        try {
          const data = await increaseDayCount(dc.id);
          const uncleanedMessage = data.message;
          const message = `${uncleanedMessage?.replaceAll(
            "{day_count}",
            `${data.dayCount}`
          )}`;
          console.log(data);

          // sendMessage(data.groupId, message + data.id);
        } catch (error) {}
      },
      {
        scheduled: false,
        timezone: "Asia/Phnom_Penh",
      }
    );
  });
  console.log(`[INFO]: ${cron.getTasks().length} jobs created.`);
};
export const startCronJobs = () => {
  cron.getTasks().forEach((job) => job.start());
  console.log(`[INFO]: ${cron.getTasks().length} jobs started.`);
};

export const stopCronJobs = () => {
  cron.getTasks().forEach((job) => job.stop());
  console.log(`[INFO]: ${cron.getTasks().length} jobs stopped.`);
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
 * sets cron.getTasks() = []
 *
 */
export const emptyNodeCronStorage = () => {
  // looked into the source code for this.
  // @ts-ignore
  global.scheduledTasks = [];
};
