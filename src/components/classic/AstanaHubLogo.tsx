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
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/astanahub_logoo.jpg"
      width={typeof size === "number" ? size : undefined}
      height={typeof size === "number" ? size : undefined}
      alt="Astana Hub Logo"
      data-logo-variant={variant}
      className={`inline-block select-none rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
};
