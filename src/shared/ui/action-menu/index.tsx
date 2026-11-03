"use client";

import { Ellipsis } from "lucide-react";
import { Fragment, useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu";

export type ActionMenuItem = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
};

export function ActionMenu({ label, items }: Readonly<{ label: string; items: ActionMenuItem[] }>) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = useRef(false);
  const tabbing = useRef(false);
  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button ref={trigger} type="button" variant="ghost" size="icon" aria-label={label}>
          <Ellipsis size={20} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        loop
        align="end"
        aria-label={label}
        onCloseAutoFocus={(event) => {
          if (selected.current || tabbing.current) {
            event.preventDefault();
            selected.current = false;
            tabbing.current = false;
          }
        }}
        onKeyDownCapture={(event) => {
          if (event.key === "Tab") {
            // Let the browser continue from the trigger to the next control.
            event.stopPropagation();
            tabbing.current = true;
            trigger.current?.focus();
            setOpen(false);
          }
        }}
      >
        {items.map((item) => (
          <Fragment key={item.label}>
            {item.separator && <DropdownMenuSeparator />}
            <DropdownMenuItem
              disabled={item.disabled}
              className={item.destructive ? "text-danger focus:bg-danger-subtle focus:text-danger" : undefined}
              onSelect={() => {
                selected.current = true;
                trigger.current?.focus();
                item.onSelect();
              }}
            >
              {item.label}
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
