import { Button } from "@/shared/ui/button";

type Props = {
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
};

export function StudentDetailQueryState({ isPending, isError, onRetry }: Readonly<Props>) {
  if (isPending) {
    return <p aria-busy="true">Загружаем ученика…</p>;
  }

  if (isError) {
    return (
      <div className="space-y-4" role="alert">
        <p>Не удалось загрузить карточку ученика.</p>
        <Button type="button" onClick={onRetry}>Повторить</Button>
      </div>
    );
  }

  return null;
}
