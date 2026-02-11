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
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
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
