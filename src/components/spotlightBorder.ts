import type { PointerEvent } from 'react';

export function syncSpotlightPointer<T extends HTMLElement>(event: PointerEvent<T>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--spotlight-x', `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty('--spotlight-y', `${event.clientY - rect.top}px`);
}
