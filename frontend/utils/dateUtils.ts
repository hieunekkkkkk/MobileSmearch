export const formatTime = (time: string): string => {
  // Convert 24-hour format to 12-hour format
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;

  return `${formattedHour}:${minutes} ${ampm}`;
};

export const isBusinessOpen = (
  openTime: string,
  closeTime: string,
  days: number[]
): boolean => {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Check if business is open today
  if (!days.includes(currentDay)) {
    return false;
  }

  // Special case for 24/7 businesses
  if (openTime === "00:00" && closeTime === "24:00") {
    return true;
  }

  // Parse current time
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  // Parse opening hours
  const [openHour, openMinute] = openTime.split(":").map(Number);
  const [closeHour, closeMinute] = closeTime.split(":").map(Number);

  const openTimeMinutes = openHour * 60 + openMinute;
  const closeTimeMinutes = closeHour * 60 + closeMinute;

  // Handle overnight business hours (e.g., 22:00 - 06:00)
  if (closeTimeMinutes < openTimeMinutes) {
    return (
      currentTimeMinutes >= openTimeMinutes ||
      currentTimeMinutes <= closeTimeMinutes
    );
  }

  // Normal business hours
  return (
    currentTimeMinutes >= openTimeMinutes &&
    currentTimeMinutes <= closeTimeMinutes
  );
};

export const formatOpeningHours = (
  openTime: string,
  closeTime: string,
  days: number[]
): string => {
  const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Special case for 24/7
  if (openTime === "00:00" && closeTime === "24:00" && days.length === 7) {
    return "24/7";
  }

  // Format days
  let daysString = "";
  if (days.length === 7) {
    daysString = "Every day";
  } else if (
    days.length === 5 &&
    days.includes(1) &&
    days.includes(2) &&
    days.includes(3) &&
    days.includes(4) &&
    days.includes(5)
  ) {
    daysString = "Weekdays";
  } else if (days.length === 2 && days.includes(0) && days.includes(6)) {
    daysString = "Weekends";
  } else {
    daysString = days.map((d) => daysMap[d]).join(", ");
  }

  return `${daysString}: ${formatTime(openTime)} - ${formatTime(closeTime)}`;
};
