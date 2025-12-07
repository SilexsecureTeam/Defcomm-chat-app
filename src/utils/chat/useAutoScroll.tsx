// hooks/useAutoScroll.ts
import { useEffect, useRef, RefObject } from "react";
interface UseAutoScrollOptions {
  messages: any[];
  containerRef: RefObject<HTMLElement>;
  endRef: RefObject<HTMLElement>;
  typing?: boolean;
  threshold?: number;
  pauseAutoScroll?: boolean; // new
}

export function useAutoScroll({
  messages,
  containerRef,
  endRef,
  typing = false,
  threshold = 100,
  pauseAutoScroll = false,
}: UseAutoScrollOptions) {
  const initialLoad = useRef(true);

  // Scroll to bottom on first load
  useEffect(() => {
    if (initialLoad.current && messages?.length > 0) {
      requestAnimationFrame(() => {
        endRef?.current?.scrollIntoView({ behavior: "auto" });
      });
      initialLoad.current = false;
    }
  }, [messages?.length, endRef]);

  // Scroll when new messages arrive (if user is near bottom)
  useEffect(() => {
    if (pauseAutoScroll) return; // 👈 don't scroll when fetching older messages
    const container = containerRef?.current;
    if (!container || !messages?.length) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;

    if (isNearBottom) {
      requestAnimationFrame(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messages, containerRef, endRef, threshold, pauseAutoScroll]);

  // Scroll when typing indicator appears (but only if near bottom)
  useEffect(() => {
    if (!typing || pauseAutoScroll) return;
    const container = containerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;

    if (isNearBottom) {
      requestAnimationFrame(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [typing, containerRef, endRef, threshold, pauseAutoScroll]);
}
