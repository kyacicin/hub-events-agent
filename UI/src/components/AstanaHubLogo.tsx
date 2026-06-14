import React from "react";

interface AstanaHubLogoProps {
  className?: string;
  size?: number | string;
  variant?: "grayscale" | "neon";
}

export const AstanaHubLogo: React.FC<AstanaHubLogoProps> = ({
  className = "",
  size = "100%",
  variant = "neon"
}) => {
  // Define color palettes
  // Define strict monochrome/grayscale palette adapting to light/dark themes
  const colors = [
    "rgba(128, 128, 128, 0.08)",
    "rgba(128, 128, 128, 0.18)",
    "rgba(128, 128, 128, 0.28)",
    "rgba(128, 128, 128, 0.40)",
    "rgba(128, 128, 128, 0.52)",
    "rgba(128, 128, 128, 0.65)",
    "rgba(128, 128, 128, 0.78)",
    "rgba(128, 128, 128, 0.90)",
    "currentColor" // Innermost core matches current text color (black elements in light theme, white in dark)
  ];

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`inline-block select-none ${className}`}
      aria-label="Astana Hub Logo"
      id="astana-hub-svg-logo"
    >
      <defs>
        {/* Clip path for the top half of the sliced sphere */}
        <clipPath id="top-half-clip">
          <path d="M 5 50 A 45 45 0 0 1 95 50 Q 50 44 5 50 Z" />
        </clipPath>

        {/* Clip path for the bottom half of the sliced sphere */}
        <clipPath id="bottom-half-clip">
          <path d="M 5 50 A 45 45 0 0 0 95 50 Q 50 56 5 50 Z" />
        </clipPath>
      </defs>

      {/* RENDER TOP HALF */}
      <g clipPath="url(#top-half-clip)">
        {/* Circle layers from large to small */}
        <circle cx="50" cy="50" r="45" fill={colors[0]} />
        <circle cx="50" cy="50" r="40" fill={colors[1]} />
        <circle cx="50" cy="50" r="35" fill={colors[2]} />
        <circle cx="50" cy="50" r="30" fill={colors[3]} />
        <circle cx="50" cy="50" r="25" fill={colors[4]} />
        <circle cx="50" cy="50" r="20" fill={colors[5]} />
        <circle cx="50" cy="50" r="15" fill={colors[6]} />
        <circle cx="50" cy="50" r="10" fill={colors[7]} />
        <circle cx="50" cy="50" r="5" fill={colors[8]} />
      </g>

      {/* RENDER BOTTOM HALF */}
      <g clipPath="url(#bottom-half-clip)">
        {/* Circle layers from large to small */}
        <circle cx="50" cy="50" r="45" fill={colors[0]} />
        <circle cx="50" cy="50" r="40" fill={colors[1]} />
        <circle cx="50" cy="50" r="35" fill={colors[2]} />
        <circle cx="50" cy="50" r="30" fill={colors[3]} />
        <circle cx="50" cy="50" r="25" fill={colors[4]} />
        <circle cx="50" cy="50" r="20" fill={colors[5]} />
        <circle cx="50" cy="50" r="15" fill={colors[6]} />
        <circle cx="50" cy="50" r="10" fill={colors[7]} />
        <circle cx="50" cy="50" r="5" fill={colors[8]} />
      </g>
    </svg>
  );
};
