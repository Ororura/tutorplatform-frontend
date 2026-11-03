"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { CreateStudentForm } from "./create-student-form";

type Props = { open?: boolean; onOpenChange?: (open: boolean) => void };
export function CreateStudentDialog({ open: controlledOpen, onOpenChange }: Readonly<Props>) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const changeOpen = (value: boolean) => {
    setLocalOpen(value);
    onOpenChange?.(value);
  };
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <Plus size={16} aria-hidden="true" />
          Добавить ученика
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Добавить ученика</DialogTitle>
          <DialogDescription>Укажите имя. Аккаунт и приглашение можно создать позже.</DialogDescription>
        </DialogHeader>
        <CreateStudentForm onSuccess={() => changeOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
