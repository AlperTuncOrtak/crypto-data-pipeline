"use client";
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

export function TimelineContent({
  children,
  animationNum = 0,
  timelineRef,
  customVariants,
  className = "",
  as: Component = "div",
}: {
  children: React.ReactNode;
  animationNum?: number;
  timelineRef?: React.RefObject<Element | null>;
  customVariants?: any;
  className?: string;
  as?: React.ElementType | string;
}) {
  const localRef = useRef(null);
  const ref = timelineRef || localRef;
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: "-50px" });

  const MotionComponent = motion(Component as any);

  return (
    <MotionComponent
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={customVariants}
      custom={animationNum}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}
