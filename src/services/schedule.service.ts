import scheduler from "node-schedule";
import {
  dbClient,
  errorHandler,
  getToday,
  sendMessage,
  validateCron,
} from "../libs/index.lib";
import {
  deleteManySkips,
  findARandomQuote,
  findSkips,
  increaseDayCount,
  increaseQuoteUseCount,
  sendReport,
} from "./index.service";

import axios from "axios";
import { Quote } from "@prisma/client";
const axiosClient = axios.create({ baseURL: `${process.env.SERVER_URL}` });

/**
 * keeps heroku app alive
 */
const createKeepAliveJob = () => {
  scheduler.scheduleJob("keep-alive", "*/20 * * * *", () => {
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
  scheduler.scheduleJob(
    `dc-${scheduleId}`,
    { rule: schedule, tz: "Asia/Bangkok" },
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

        const needsQuote = data.message.includes("$quote");
        let quote: Quote | null = null;
        if (needsQuote) {
          quote = await findARandomQuote()
            .then(async (quote) => {
              if (!quote) return null;
              return await increaseQuoteUseCount(quote.id);
            })
            .catch((e) => {
              console.log(e);
              return null;
            });
        }

        const uncleanedMessage = data.message;
        const message = uncleanedMessage
          ?.replace(/\$count/g, data.dayCount.toString())
          .replace(/\$quote/g, quote ? quote.text : "")
          .replace(/\\\\n/g, "\n");

        sendMessage(Number(data.groupId), message);
      } catch (error) {
        errorHandler(groupId, error);
      }
    }
  );
};

/**
 * byte to megabytes
 * @param {number} n number of size
 * @returns result in mb
 */
const inMb = (n: number) => {
  return (n / 1024 / 1024).toFixed(2) + " MB";
};

const memoryUsageJob = () => {
  scheduler.scheduleJob(
    "RESOURCE USAGE",
    { rule: "*/10 * * * * *", tz: "Asia/Bangkok" },
    (date) => {
      const usage: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
        arrayBuffers: number;
      } = process.memoryUsage();
      console.log(
        `${date.toLocaleString()}\nThe script uses approximately ${inMb(
          usage.heapUsed
        )}`
      );

      let msg = "==========\n";
      Object.keys(usage).map((key) => {
        // @ts-ignore
        msg += key + " = " + inMb(Number(usage[`${key}`])) + "\n";
      });
      msg += "==========";
      console.log(msg);
    }
  );
};

/**
 * creates cron jobs.
 */
export const createCronJobs = async () => {
  try {
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
          validateCron(`${dayCount?.schedule}`)
        );
      });

    all.forEach(async (dc) => {
      await generateJob(dc.schedule, dc.id, Number(dc.groupId));
    });

    console.log(
      `[INFO]: ${Object.keys(scheduler.scheduledJobs).length} jobs created.`
    );
  } catch (error) {
    console.error(error);
  }
};

/**
 * stops cron jobs.
 */
const stopAllJob = async () => {
  await scheduler.gracefulShutdown();
};

/**
 * restart cron jobs.
 */
export const restartAllJobs = async () => {
  console.log(`******* Restarting Cron Jobs *******`);
  await stopAllJob();
  await createCronJobs();
  console.log(`********* Restarting Done **********`);
};
