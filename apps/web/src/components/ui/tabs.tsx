"use client";

import { useId, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabItem = { value: string; label: string; content: ReactNode; disabled?: boolean };

export function Tabs({ items, defaultValue, className }: { items: TabItem[]; defaultValue?: string; className?: string }) {
  const firstEnabled = items.find((item) => !item.disabled)?.value ?? "";
  const [value, setValue] = useState(defaultValue ?? firstEnabled);
  const baseId = useId();
  const active = items.find((item) => item.value === value) ?? items[0];

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const enabledIndexes = items.map((item, index) => ({ item, index })).filter(({ item }) => !item.disabled).map(({ index }) => index);
    if (!enabledIndexes.length) return;
    const currentEnabledIndex = enabledIndexes.indexOf(currentIndex);
    let nextIndex = currentIndex;
    if (event.key === "Home") nextIndex = enabledIndexes[0];
    if (event.key === "End") nextIndex = enabledIndexes[enabledIndexes.length - 1];
    if (event.key === "ArrowRight") nextIndex = enabledIndexes[(currentEnabledIndex + 1) % enabledIndexes.length];
    if (event.key === "ArrowLeft") nextIndex = enabledIndexes[(currentEnabledIndex - 1 + enabledIndexes.length) % enabledIndexes.length];
    const next = items[nextIndex];
    setValue(next.value);
    document.getElementById(`${baseId}-tab-${next.value}`)?.focus();
  };

  return (
    <div className={cn("tabs", className)}>
      <div className="tabs__list" role="tablist" aria-label="Tabs">
        {items.map((item, index) => (
          <button
            key={item.value}
            id={`${baseId}-tab-${item.value}`}
            className={cn("tabs__trigger", item.value === value && "tabs__trigger--active")}
            type="button"
            role="tab"
            aria-selected={item.value === value}
            aria-controls={`${baseId}-panel-${item.value}`}
            tabIndex={item.value === value ? 0 : -1}
            disabled={item.disabled}
            onClick={() => setValue(item.value)}
            onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => onKeyDown(event, index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {active ? (
        <div id={`${baseId}-panel-${active.value}`} className="tabs__panel" role="tabpanel" aria-labelledby={`${baseId}-tab-${active.value}`} tabIndex={0}>
          {active.content}
        </div>
      ) : null}
    </div>
  );
}
