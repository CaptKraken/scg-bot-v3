export const getToday = () => new Date(new Date().setHours(7, 0, 0, 0));

export const getTomorrow = () => {
  const today = getToday();
  let tomorrow = new Date(today.setDate(today.getDate() + 1));
  // idk why. UTC +7, maybe?
  return tomorrow;
};

export const isValidDate = (date: Date | string) => {
  return !isNaN(new Date(date).getTime());
};

export const khmerDateToISO = (date: string) => {
  if (!date) return undefined;
  const parts = date.split("/");
  const { day, month, year } = {
    day: parts[0],
    month: parts[1],
    year: parts[2],
  };

  const formatted = new Date(
    `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00.000Z`
  );

  return isValidDate(formatted) ? formatted : undefined;
};
