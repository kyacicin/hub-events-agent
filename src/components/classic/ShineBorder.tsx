"use client";

import type React from "react";

type TColorProp = string | string[];

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: TColorProp;
  className?: string;
  children: React.ReactNode;
}

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function ShineBorder({
  borderRadius = 8,
  borderWidth = 1,
  duration = 14,
  color = "#006239",
  className,
  children,
}: ShineBorderProps) {
  const colors = Array.isArray(color) ? color : [color];
  const radialStops = ["transparent", "transparent", ...colors, "transparent", "transparent"].join(",");

  return (
    <div
      style={
        {
          "--shine-border-radius": `${borderRadius}px`,
          "--shine-border-width": `${borderWidth}px`,
          "--shine-duration": `${duration}s`,
          "--shine-background": `radial-gradient(${radialStops})`,
        } as React.CSSProperties
      }
      className={cx("classic-shine-border", className)}
    >
      <div className="classic-shine-content">{children}</div>
    </div>
  );
}
