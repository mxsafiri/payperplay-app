"use client";

import { useEffect, useRef, useState } from "react";

export function Typewriter({
  text,
  texts,
  speed = 80,
  className,
  highlights,
  highlightClass = "text-primary-500",
}: {
  text?: string;
  texts?: string[];
  speed?: number;
  className?: string;
  highlights?: string[];
  highlightClass?: string;
}) {
  const phrases = texts && texts.length > 0 ? texts : text ? [text] : [""];
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      const current = phrases[indexRef.current % phrases.length];
      setDisplayed("");
      setDone(false);

      // Type forward
      let i = 0;
      interval = setInterval(() => {
        if (cancelled) return;
        i++;
        setDisplayed(current.slice(0, i));
        if (i >= current.length) {
          clearInterval(interval);
          setDone(true);

          // Pause, then erase
          timeout = setTimeout(() => {
            if (cancelled) return;
            setDone(false);
            let j = current.length;
            interval = setInterval(() => {
              if (cancelled) return;
              j--;
              setDisplayed(current.slice(0, j));
              if (j <= 0) {
                clearInterval(interval);
                // Move to next phrase
                indexRef.current++;
                // Pause, then restart with next phrase
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
  }, [phrases.join("|"), speed]);

  const renderHighlighted = (str: string) => {
    if (!highlights || highlights.length === 0) return str;
    const pattern = new RegExp(`(${highlights.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    const parts = str.split(pattern);
    return parts.map((part, i) => {
      const isHL = highlights.some(h => h.toLowerCase() === part.toLowerCase());
      return isHL ? (
        <span key={i} className={highlightClass}>{part}</span>
      ) : (
        <span key={i}>{part}</span>
      );
    });
  };

  return (
    <span className={className}>
      {renderHighlighted(displayed)}
      <span
        className={`inline-block w-[3px] h-[1em] ml-0.5 align-middle bg-current ${
          done ? "animate-pulse" : "animate-[blink_0.6s_step-end_infinite]"
        }`}
      />
    </span>
  );
}
