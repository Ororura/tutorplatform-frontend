"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";

import { learningProgramQueries } from "@/entities/learning-program";
import { studentProgramQueries, type StudentProgramSummary } from "@/entities/student-program";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useAssignStudentProgramMutation } from "../api/assign-student-program";
import { DEFAULT_REPORT_INTERVAL_HOURS, reportHoursToMinutes } from "../model/report-interval";

type Props = {
  studentId: string;
  triggerLabel: "Назначить программу" | "Назначить ещё программу";
  onAssigned: (program: StudentProgramSummary) => void;
};

export function AssignLearningProgramDialog({ studentId, triggerLabel, onAssigned }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [reportHours, setReportHours] = useState(String(DEFAULT_REPORT_INTERVAL_HOURS));
  const [programError, setProgramError] = useState<string>();
  const [intervalError, setIntervalError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const mutation = useAssignStudentProgramMutation(studentId);
  const queryClient = useQueryClient();
  const templates = useQuery({ ...learningProgramQueries.list("ACTIVE"), enabled: open });
  const assignments = useQuery({ ...studentProgramQueries.list(studentId), enabled: open });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => {
    setOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  };

  const openDialog = () => {
    setProgramError(undefined);
    setIntervalError(undefined);
    setSubmitError(undefined);
    setOpen(true);
  };

  const assignedProgramIds = new Set(
    assignments.data
      ?.filter((program) => program.status === "ACTIVE" || program.status === "PAUSED")
      .map((program) => program.learningProgramId),
  );
  const hasAssignableTemplate = templates.data?.some((template) => !assignedProgramIds.has(template.id));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) return;
    setProgramError(undefined);
    setIntervalError(undefined);
    setSubmitError(undefined);

    if (!selectedProgramId) {
      setProgramError("Выберите программу");
      return;
    }
    const minutes = reportHoursToMinutes(Number(reportHours));
    if (minutes === null) {
      setIntervalError("Введите положительное число часов; минуты должны быть целыми");
      return;
    }

    try {
      const created = await mutation.mutateAsync({
        learningProgramId: selectedProgramId,
        reportIntervalMinutes: minutes,
      });
      setSelectedProgramId("");
      setReportHours(String(DEFAULT_REPORT_INTERVAL_HOURS));
      close();
      onAssigned(created);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 409 && error.body.code === "STUDENT_PROGRAM_ALREADY_ASSIGNED") {
          setSubmitError("Эта программа уже назначена ученику");
          await queryClient.invalidateQueries({ queryKey: studentProgramQueries.list(studentId).queryKey });
          return;
        }
        if (error.status === 404 || (error.status === 409 && error.body.code === "LEARNING_PROGRAM_STATUS_CONFLICT")) {
          setSubmitError("Программа больше недоступна для назначения. Обновите список и выберите другую.");
          await Promise.all([templates.refetch(), assignments.refetch()]);
          return;
        }
        if (error.status === 400) {
          const intervalDetail = error.body.details.find((detail) => detail.field === "reportIntervalMinutes");
          if (intervalDetail) setIntervalError(intervalDetail.message);
          setSubmitError(intervalDetail ? "Проверьте интервал отчёта." : error.body.message);
          return;
        }
      }
      setSubmitError("Не удалось назначить программу. Попробуйте ещё раз.");
    }
  };

  const loading = templates.isPending || assignments.isPending;
  const loadError = templates.isError || assignments.isError;

  return (
    <>
      <Button ref={triggerRef} type="button" onClick={openDialog}>{triggerLabel}</Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(42rem,calc(100%-2rem))] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/35"
        onClose={() => setOpen(false)}
      >
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-xl font-semibold">Назначить программу</h2>
              <p className="mt-1 text-sm text-neutral-600">Выберите активную программу и интервал отчёта.</p>
            </div>
            <button className="rounded px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100" type="button" onClick={close} aria-label="Закрыть">Закрыть</button>
          </div>

          {loading && <p className="rounded-lg border border-neutral-200 p-5 text-neutral-600" aria-busy="true">Загружаем доступные программы…</p>}
          {loadError && (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
              <p>Не удалось загрузить программы для назначения.</p>
              <Button type="button" onClick={() => { void templates.refetch(); void assignments.refetch(); }}>Повторить</Button>
            </div>
          )}
          {!loading && !loadError && templates.data?.length === 0 && (
            <p className="rounded-lg border border-dashed border-neutral-300 p-5">Нет программ, доступных для назначения</p>
          )}
          {!loading && !loadError && templates.data && templates.data.length > 0 && (
            <form className="space-y-5" onSubmit={submit} noValidate>
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Программа обучения</legend>
                {templates.data.map((template) => {
                  const alreadyAssigned = assignedProgramIds.has(template.id);
                  return (
                    <label key={template.id} className="flex cursor-pointer gap-3 rounded-lg border border-neutral-200 p-4 has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-neutral-100">
                      <input
                        type="radio"
                        name="learningProgram"
                        value={template.id}
                        checked={selectedProgramId === template.id}
                        disabled={alreadyAssigned}
                        onChange={() => { setSelectedProgramId(template.id); setProgramError(undefined); }}
                      />
                      <span className="min-w-0">
                        <span className="block font-medium">{template.title}</span>
                        <span className="mt-1 block text-sm text-neutral-600">{template.subject.name} · Активна</span>
                        {template.description && <span className="mt-1 block text-sm text-neutral-700">{template.description}</span>}
                        {alreadyAssigned && <span className="mt-2 block text-sm font-medium text-neutral-700">Уже назначена</span>}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
              {programError && <p className="text-sm text-red-700">{programError}</p>}
              {!hasAssignableTemplate && <p className="text-sm text-neutral-700">Нет программ, доступных для назначения</p>}
              <div className="space-y-2">
                <label className="block text-sm font-medium" htmlFor="assign-report-hours">Интервал отчёта, часов</label>
                <input
                  id="assign-report-hours"
                  className="h-10 w-full rounded-md border border-neutral-300 px-3 outline-none focus:ring-2 focus:ring-neutral-300"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={reportHours}
                  onChange={(event) => { setReportHours(event.target.value); setIntervalError(undefined); }}
                  aria-invalid={Boolean(intervalError)}
                  aria-describedby={intervalError ? "assign-report-error" : "assign-report-help"}
                />
                <p id="assign-report-help" className="text-xs text-neutral-500">Можно указать половину часа, например 1,5 часа = 90 минут.</p>
                {intervalError && <p id="assign-report-error" className="text-sm text-red-700">{intervalError}</p>}
              </div>
              {submitError && <p className="text-sm text-red-700" role="alert">{submitError}</p>}
              <Button type="submit" disabled={mutation.isPending || !hasAssignableTemplate}>
                {mutation.isPending ? "Назначаем…" : "Назначить"}
              </Button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
