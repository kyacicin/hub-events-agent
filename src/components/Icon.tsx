import type { CSSProperties } from "react";

export type IconName =
  | "bot"
  | "calendar"
  | "chevron-down"
  | "clock"
  | "copy"
  | "globe"
  | "home"
  | "instagram"
  | "link"
  | "map"
  | "message"
  | "refresh"
  | "search"
  | "send"
  | "sidebar"
  | "sparkles"
  | "user"
  | "users";

type IconProps = {
  name: IconName;
  className?: string;
};

export function Icon({ name, className = "" }: IconProps) {
  const mask = `url(/${name}.svg) center / contain no-repeat`;
  const style = {
    WebkitMask: mask,
    mask,
  } satisfies CSSProperties;

  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={style}
    />
  );
}
