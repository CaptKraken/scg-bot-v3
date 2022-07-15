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
import axios from "axios";
const axiosClient = axios.create({ baseURL: `${process.env.SERVER_URL}` });

/**
 * keeps heroku app alive
 */
const createKeepAliveJob = () => {
  cron.schedule(
    "*/5 * * * *",
    () => {
      try {
        axiosClient.get("/");
      } catch (e) {
        // ts-ignore
        console.log("[KEEP ALIVE ERROR]:", `Error fetching the thing.`);
      }
    },
    {
      scheduled: false,
      timezone: "Asia/Phnom_Penh",
    }
  );
};

const generateJob = async (
  schedule: string,
  scheduleId: number,
  groupId: number
) => {
  cron.schedule(
    `${schedule}`,
    async () => {
      try {
        const today = getToday();
        const skips = await findSkips(scheduleId, today);

        if (skips.length > 0) {
          console.info(
            `[INFO: ${new Date().toLocaleString(
              "km-KH"
            )}] Day count ${scheduleId} skipped.`
          );
          return await deleteManySkips(scheduleId, today);
        }

        const data = await increaseDayCount(scheduleId, 1);
        if (scheduleId === Number(process.env.READING_GROUP_DAY_COUNT_ID)) {
          return sendReport();
        }

        const uncleanedMessage = data.message;
        const message = `${uncleanedMessage?.replace(
          /\{day_count}/g,
          `${data.dayCount}`
        )}`;

        sendMessage(data.groupId, message);
      } catch (error) {
        errorHandler(groupId, error);
      }
    },
    {
      scheduled: false,
      timezone: "Asia/Phnom_Penh",
    }
  );
};

/**
 * creates cron jobs.
 */
export const createCronJobs = async () => {
  createKeepAliveJob();
  let all = await dbClient.dayCount
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
    await generateJob(dc.schedule, dc.id, dc.groupId);
  });
  all = [];
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
  emptyNodeCronStorage();
  await createCronJobs();
  startCronJobs();
};

/**
 * restart cron jobs
 */
export const restartCronJobs = async () => {
  console.log(`******* Restarting Cron Jobs *******`);
  stopCronJobs();
  emptyNodeCronStorage();
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
