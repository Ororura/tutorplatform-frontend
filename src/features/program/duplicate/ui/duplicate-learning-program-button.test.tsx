import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { learningProgramQueries } from "@/entities/learning-program";

import { DuplicateLearningProgramButton } from "./duplicate-learning-program-button";

const mocks = vi.hoisted(() => ({ post: vi.fn(), push: vi.fn() }));

vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/client")>()),
  apiClient: { POST: mocks.post },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));

const created = { id: "copy-uuid", slug: "algebra-kopiya", status: "DRAFT" };
const success = { data: created, response: { status: 201 } };

function renderButton() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <QueryClientProvider client={client}>
      <DuplicateLearningProgramButton programId="original-uuid" />
    </QueryClientProvider>,
  );
  const trigger = screen.getByRole("button", { name: "Создать копию" });
  fireEvent.click(trigger);
  const dialog = screen.getByRole("dialog", { name: "Создать копию программы?" });
  const confirm = within(dialog).getByRole("button", { name: "Создать копию" });
  return { invalidate, trigger, dialog, confirm };
}

describe("DuplicateLearningProgramButton", () => {
  beforeEach(() => {
    mocks.post.mockReset().mockResolvedValue(success);
    mocks.push.mockReset();
  });

  it("opens confirmation and cancels without calling the API", () => {
    const { dialog } = renderButton();

    expect(dialog).toHaveAccessibleDescription(
      "Будет создан новый черновик со структурой, материалами и заданиями этой программы. Назначения учеников и их прогресс не копируются.",
    );
    expect(mocks.post).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Отмена" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("duplicates once, invalidates lists, and navigates to the new draft by slug", async () => {
    const { invalidate, confirm } = renderButton();
    fireEvent.click(confirm);

    await waitFor(() => expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/teacher/programs/algebra-kopiya"));
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith("/api/v1/teacher/programs/{programId}/duplicate", {
      params: { path: { programId: "original-uuid" } },
    });
    expect(invalidate).toHaveBeenCalledExactlyOnceWith({ queryKey: learningProgramQueries.lists() });
    expect(invalidate.mock.invocationCallOrder[0]).toBeLessThan(mocks.push.mock.invocationCallOrder[0]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("blocks immediate double clicks and disables actions while the request is pending", async () => {
    let resolveRequest!: (value: typeof success) => void;
    mocks.post.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { trigger, dialog, confirm } = renderButton();

    act(() => {
      fireEvent.click(confirm);
      fireEvent.click(confirm);
    });

    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Создаём…" })).toBeDisabled());
    expect(trigger).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Отмена" })).toBeDisabled();
    fireEvent.click(confirm);
    fireEvent.click(trigger);
    const cancel = new Event("cancel", { cancelable: true });
    fireEvent(dialog, cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog).toHaveAttribute("open");
    expect(mocks.post).toHaveBeenCalledTimes(1);
    expect(mocks.push).not.toHaveBeenCalled();

    await act(async () => resolveRequest(success));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledTimes(1));
  });

  it("waits for list invalidation before navigating", async () => {
    let finishInvalidation!: () => void;
    const { invalidate, dialog, confirm } = renderButton();
    invalidate.mockReturnValue(
      new Promise<void>((resolve) => {
        finishInvalidation = resolve;
      }),
    );
    fireEvent.click(confirm);

    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1));
    expect(within(dialog).getByRole("button", { name: "Создаём…" })).toBeDisabled();
    expect(mocks.push).not.toHaveBeenCalled();
    await act(async () => finishInvalidation());
    await waitFor(() => expect(mocks.push).toHaveBeenCalledTimes(1));
  });

  it.each([403, 404, 500])("keeps the dialog open after an API %s error and allows retry", async (status) => {
    mocks.post.mockResolvedValueOnce({ error: { message: "API failure" }, response: { status } });
    const { invalidate, dialog, confirm } = renderButton();
    fireEvent.click(confirm);

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Не удалось создать копию программы. Попробуйте ещё раз.",
    );
    expect(dialog).toHaveAttribute("open");
    expect(mocks.push).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(mocks.post).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(confirm).toBeEnabled());

    fireEvent.click(confirm);
    await waitFor(() => expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/teacher/programs/algebra-kopiya"));
    expect(mocks.post).toHaveBeenCalledTimes(2);
  });
});
