export const formatTimeForDisplay = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  
  return `${formattedMinutes}:${formattedSeconds}`;
};

export const calculateTimerProgress = (elapsed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
};