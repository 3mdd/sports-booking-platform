export function formatDisplayTime(timeValue, fallback = "Not available") {
  if (!timeValue) return fallback;

  const textValue = String(timeValue).trim();

  if (/\b(am|pm)\b/i.test(textValue)) {
    return textValue;
  }

  const timeOnlyMatch = textValue.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (timeOnlyMatch) {
    const hours = Number(timeOnlyMatch[1]);
    const minutes = Number(timeOnlyMatch[2]);

    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const period = hours >= 12 ? "PM" : "AM";
      const displayHour = hours % 12 || 12;

      return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
    }
  }

  const date = new Date(timeValue);

  if (Number.isNaN(date.getTime())) {
    return textValue || fallback;
  }

  return date
    .toLocaleTimeString("en-MY", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\b(am|pm)\b/i, (period) => period.toUpperCase());
}

function isLaterCalendarDate(startTime, endTime) {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    return false;
  }

  return (
    endDate.getFullYear() !== startDate.getFullYear() ||
    endDate.getMonth() !== startDate.getMonth() ||
    endDate.getDate() !== startDate.getDate()
  );
}

export function formatDisplayTimeRange(startTime, endTime) {
  const range = `${formatDisplayTime(startTime)} - ${formatDisplayTime(
    endTime
  )}`;

  return isLaterCalendarDate(startTime, endTime)
    ? `${range} (next day)`
    : range;
}

export function formatDisplaySlotLabel(slotLabel, fallback = "Not available") {
  if (!slotLabel) return fallback;

  const [startTime, endTime] = String(slotLabel).split(" - ");

  if (!startTime || !endTime) {
    return formatDisplayTime(slotLabel, fallback);
  }

  return formatDisplayTimeRange(startTime, endTime);
}
