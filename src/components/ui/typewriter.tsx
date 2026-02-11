"use client";

import { useEffect, useState } from "react";

export function Typewriter({
  text,
  speed = 80,
  className,
}: {
  text: string;
  speed?: number;
  className?: string;
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      setDisplayed("");
      setDone(false);

      // Type forward
      let i = 0;
      interval = setInterval(() => {
        if (cancelled) return;
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);

          // Pause, then erase
          timeout = setTimeout(() => {
            if (cancelled) return;
            setDone(false);
            let j = text.length;
            interval = setInterval(() => {
              if (cancelled) return;
              j--;
              setDisplayed(text.slice(0, j));
              if (j <= 0) {
                clearInterval(interval);
                // Pause, then restart
                timeout = setTimeout(run, 800);
              }
            }, 30);
          }, 2000);
        }
      }, speed);
    };

    run();
    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [text, speed]);

  return (
    <span className={className}>
      {displayed}
      <span
        className={`inline-block w-[3px] h-[1em] ml-0.5 align-middle bg-current ${
          done ? "animate-pulse" : "animate-[blink_0.6s_step-end_infinite]"
        }`}
      />
    </span>
  );
}
