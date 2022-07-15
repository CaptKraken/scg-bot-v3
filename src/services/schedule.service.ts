import scheduler from "node-schedule";
import {
  dbClient,
  errorHandler,
  getToday,
  sendMessage,
} from "../libs/index.lib";
import {
  deleteManySkips,
  findSkips,
  increaseDayCount,
  sendReport,
} from "./index.service";

import axios from "axios";
const axiosClient = axios.create({ baseURL: `${process.env.SERVER_URL}` });

/**
 * keeps heroku app alive
 */
const createKeepAliveJob = () => {
  scheduler.scheduleJob("keep-alive", "*/5 * * * *", () => {
    try {
      axiosClient.get("/");
    } catch (e) {
      // ts-ignore
      console.log("[KEEP ALIVE ERROR]:", `Error fetching the thing.`);
    }
  });
};

const generateJob = async (
  schedule: string,
  scheduleId: number,
  groupId: number
) => {
  scheduler.scheduleJob(`${scheduleId}`, `${schedule}`, async () => {
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
  });
};
const inMb = (n: number) => {
  return (n / 1024 / 1024).toFixed(2) + " MB";
};
/**
 * creates cron jobs.
 */
export const createCronJobs = async () => {
  createKeepAliveJob();
  scheduler.scheduleJob("RESOURCES-USAGE", "*/10 * * * * *", () => {
    const usage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    } = process.memoryUsage();
    console.log(`The script uses approximately ${inMb(usage.heapUsed)}`);
    // const { rss, heapTotal, heapUsed, external, arrayBuffers } =
    //   ;

    let msg = "==========\n";
    Object.keys(usage).map((key) => {
      // @ts-ignore
      msg += key + " = " + inMb(Number(usage[`${key}`])) + "\n";
    });
    msg += "==========";
    console.log(msg);

    // console.log(`${rss / 102}`);
  });
  let all = await dbClient.dayCount.findMany({
    select: {
      id: true,
      groupId: true,
      schedule: true,
    },
  });
  // .then((dayCounts) => {
  //   return dayCounts.filter((dayCount) =>
  //     cron.validate(`${dayCount?.schedule}`)
  //   );
  // });

  all.forEach(async (dc) => {
    await generateJob(dc.schedule, dc.id, dc.groupId);
  });
  all = [];
  console.log(`[INFO]: ${Object.keys(scheduler.scheduledJobs)} jobs created.`);
};
