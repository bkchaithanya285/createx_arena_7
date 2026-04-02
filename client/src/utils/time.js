/**
 * Helper to format seconds into a professional HH:MM:SS countdown string.
 */
export const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '00:00:00';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  return [h, m, s]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
};
