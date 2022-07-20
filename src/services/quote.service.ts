import { Prisma } from "@prisma/client";
import { dbClient } from "../libs/index.lib";

/**
 * finds all quotes.
 * @returns a list of quotes
 */
export const findAllQuotes = async () => {
  return await dbClient.quote.findMany();
};

/**
 * finds one random quote
 */
export const findARandomQuote = async () => {
  // const fields = ["id", "text", "useCount", "createdAt", "updatedAt"];
  // const orders = ["asc", "desc"];
  // const payload: Prisma.QuoteOrderByWithRelationInput = {};
  // const field = fields[
  //   getRandomInt(fields.length)
  // ] as Prisma.QuoteScalarFieldEnum;
  // const order = orders[getRandomInt(orders.length)] as Prisma.SortOrder;
  // payload[field] = order;
  return await dbClient.quote.findFirst({
    orderBy: {
      useCount: "asc",
    },
  });
};

/**
 * increases a quote's useCount.
 */
export const increaseQuoteUseCount = async (id: number) => {
  return await dbClient.quote
    .update({
      where: { id },
      data: {
        useCount: { increment: 1 },
      },
    })
    .catch((e) => {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2025") {
          throw new Error(`Quote with id ${id} not found.`);
        }
      }
      throw new Error(e);
    });
};

/**
 * finds one quote record.
 * @param {number} id quote id
 * @returns a quote
 */
export const findOneQuote = async (id: number) => {
  const quote = await dbClient.quote.findUnique({ where: { id } });
  if (!quote) throw new Error(`Quote ${id} not found.`);
  return quote;
};

/**
 * creates a quote record.
 * @param {string} text quote text
 * @returns a quote
 */
export const createQuote = async (text: string) => {
  if (!text) throw new Error(`Quote text invalid.`);
  return await dbClient.quote.upsert({
    where: {
      text,
    },
    create: {
      text,
    },
    update: {},
  });
};

/**
 * updates a quote record.
 * @param id quote id
 * @param text new quote text
 * @returns a quote
 */
export const updateQuote = async (id: number, text: string) => {
  if (!text) throw new Error(`Quote text invalid.`);
  return await dbClient.quote.update({
    where: {
      id,
    },
    data: {
      text,
    },
  });
};
type NameOrId = {
  id?: number;
  text?: string;
};

/**
 * deletes a quote.
 * @param {NameOrId} dto name or id
 * @returns the deleted quote
 */
export const deleteQuote = async ({ id, text }: NameOrId) => {
  if (!id && !text) {
    throw new Error("Quote id or text required.");
  }
  const payload = id ? { id } : { text };
  return await dbClient.quote.delete({ where: payload });
};

export const createManyQuotes = async (quotes: string[]) => {
  if (quotes.length === 0) return quotes;

  const payload = quotes.map((text) => {
    return { text };
  });

  return dbClient.quote.createMany({ data: payload });
};
