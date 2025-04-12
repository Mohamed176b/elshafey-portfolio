const RATE_LIMIT_KEY = "contact_form_rate_limit";

export const checkRateLimit = () => {
  const now = new Date();
  const stored = localStorage.getItem(RATE_LIMIT_KEY);

  if (!stored) return { canSubmit: true, waitTime: 0, attempts: 0 };

  const data = JSON.parse(stored);
  const lastAttempt = new Date(data.lastAttempt);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfLastAttemptDay = new Date(
    lastAttempt.getFullYear(),
    lastAttempt.getMonth(),
    lastAttempt.getDate()
  );

  // Reset if it's a new day
  if (startOfDay > startOfLastAttemptDay) {
    return { canSubmit: true, waitTime: 0, attempts: 0 };
  }

  const waitTimeInHours = Math.pow(2, data.attempts - 1); // Doubles each time
  const waitTimeInMs = waitTimeInHours * 60 * 60 * 1000;
  const timeElapsed = now.getTime() - lastAttempt.getTime();
  const remainingTime = Math.max(0, waitTimeInMs - timeElapsed);

  return {
    canSubmit: remainingTime === 0,
    waitTime: Math.ceil(remainingTime / 1000), // Convert to seconds
    attempts: data.attempts,
  };
};

export const updateRateLimit = () => {
  const stored = localStorage.getItem(RATE_LIMIT_KEY);
  const now = new Date();
  const data = stored ? JSON.parse(stored) : { attempts: 0 };
  const lastAttempt = data.lastAttempt ? new Date(data.lastAttempt) : null;

  // If it's a new day or first attempt, reset attempts
  if (
    !lastAttempt ||
    new Date(now.getFullYear(), now.getMonth(), now.getDate()) >
      new Date(
        lastAttempt.getFullYear(),
        lastAttempt.getMonth(),
        lastAttempt.getDate()
      )
  ) {
    data.attempts = 1;
  } else {
    data.attempts += 1;
  }

  data.lastAttempt = now.toISOString();
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));

  return data;
};

export const formatTimeRemaining = (seconds) => {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`;
  return `${Math.ceil(seconds / 3600)} hours`;
};
