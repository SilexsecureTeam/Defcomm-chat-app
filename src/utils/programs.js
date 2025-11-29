export const checkIfAtBottom = (containerRef, threshold = 40) => {
  const container = containerRef?.current;
  if (!container) return true;
  const distanceFromBottom =
    container.scrollHeight - (container.scrollTop + container.clientHeight);
  return distanceFromBottom <= threshold;
};
