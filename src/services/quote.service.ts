import { dbClient } from "../libs";

export const findAllQuotes = async () => {
  return await dbClient.quote.findMany();
};

export const findOneQuotes = async (id: number) => {
  const quote = await dbClient.quote.findUnique({ where: { id } });
  if (!quote) throw new Error(`Quote ${id} not found.`);
  return quote;
};

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

export const deleteQuote = async ({
  id,
  text,
}: {
  id?: number;
  text?: string;
}) => {
  if (!id && !text) {
    throw new Error("Quote id or text required.");
  }
  const payload = id ? { id } : { text };
  await dbClient.quote.delete({ where: payload });
};
