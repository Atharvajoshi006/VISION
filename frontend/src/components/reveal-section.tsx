"use client";

import { motion, useInView } from "framer-motion";
import { useRef, CSSProperties } from "react";

const ease = [0.215, 0.61, 0.355, 1] as [number, number, number, number];

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left";
  className?: string;
  style?: CSSProperties;
}

export function RevealSection({ children, delay = 0, direction = "up", className = "", style }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });

  const variants = {
    hidden: { opacity: 0, y: direction === "up" ? 52 : 0, x: direction === "left" ? -20 : 0 },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: { duration: 1, delay, ease },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
