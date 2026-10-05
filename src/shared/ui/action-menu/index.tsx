"use client";

import { Ellipsis } from "lucide-react";
import { Fragment, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/shared/ui/button";

export type ActionMenuItem = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
};

export function ActionMenu({ label, items }: Readonly<{ label: string; items: ActionMenuItem[] }>) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const initialFocus = useRef<"first" | "last">("first");
  const enabledItems = () => [...(menu.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];

  useEffect(() => {
    if (!open) return;
    const buttons = enabledItems();
    (initialFocus.current === "last" ? buttons.at(-1) : buttons[0])?.focus({ preventScroll: true });
    const bounds = menu.current?.getBoundingClientRect();
    if (
      bounds &&
      bounds.bottom > window.innerHeight &&
      bounds.height < (trigger.current?.getBoundingClientRect().top ?? 0)
    ) {
      menu.current!.style.top = "auto";
      menu.current!.style.bottom = "100%";
    }
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  const close = () => {
    trigger.current?.focus();
    setOpen(false);
  };

  return (
    <div
      ref={root}
      className="relative shrink-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <Button
        ref={trigger}
        type="button"
        variant="ghost"
        className="size-10 rounded-control p-0"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => {
          initialFocus.current = "first";
          setOpen(!open);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            initialFocus.current = event.key === "ArrowUp" ? "last" : "first";
            setOpen(true);
          }
        }}
      >
        <Ellipsis size={20} aria-hidden="true" />
      </Button>
      {open && (
        <div
          ref={menu}
          id={id}
          role="menu"
          aria-label={label}
          className="absolute right-0 top-full z-30 my-1 w-56 max-w-[calc(100vw-2rem)] rounded-inset border border-border bg-surface p-1 shadow-(--shadow-floating)"
          onKeyDown={(event) => {
            const buttons = enabledItems();
            const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
            if (event.key === "Escape" || event.key === "Tab") {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
              }
              close();
            } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? buttons.length - 1
                    : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
              buttons[next]?.focus();
            }
          }}
        >
          {items.map((item) => (
            <Fragment key={item.label}>
              {item.separator && <div role="separator" className="my-1 border-t border-border" />}
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                disabled={item.disabled}
                className={`flex min-h-11 w-full items-center rounded-control px-3 py-2 text-left text-sm hover:bg-surface-subtle focus-visible:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-focus-ring disabled:opacity-40 ${item.destructive ? "text-danger" : "text-foreground-muted"}`}
                onClick={() => {
                  close();
                  item.onSelect();
                }}
              >
                {item.label}
              </button>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
