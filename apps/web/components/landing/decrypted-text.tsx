"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  className?: string;
  parentClassName?: string;
  animateOn?: "view" | "hover";
  revealDirection?: "start" | "end" | "center";
}

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  className,
  parentClassName,
  animateOn = "hover",
  revealDirection = "start",
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let currentIteration = 0;

    if (isHovering || animateOn === "view") {
      setIsScrambling(true);
      interval = setInterval(() => {
        setDisplayText((currentText) =>
          text
            .split("")
            .map((char, index) => {
              if (char === " ") return " ";
              if (revealedIndices.has(index) || currentIteration >= maxIterations) {
                return char;
              }
              return characters[Math.floor(Math.random() * characters.length)];
            })
            .join("")
        );
        currentIteration++;
        if (currentIteration >= maxIterations) {
          setIsScrambling(false);
          clearInterval(interval);
          setDisplayText(text);
        }
      }, speed);
    } else {
      setDisplayText(text);
      clearInterval(intervalRef.current as NodeJS.Timeout);
    }

    return () => clearInterval(interval);
  }, [isHovering, text, speed, maxIterations, animateOn, revealedIndices]);

  return (
    <span
      className={parentClassName}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <span className={className}>{displayText}</span>
    </span>
  );
}
