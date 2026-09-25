import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ImportContentPackageDialog } from "./import-content-package-dialog";

const renderDialog = () => render(<ImportContentPackageDialog programId="program-1" editable />);

describe("ImportContentPackageDialog", () => {
  it("opens with an accessible title and closes without retaining errors", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Импортировать модули" }));
    expect(screen.getByRole("dialog", { name: "Импорт учебных модулей" })).toBeInTheDocument();
    expect(screen.getByText("Готового файла нет?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Проверить файл" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Выберите YAML-файл.");
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Импортировать модули" }));
    expect(screen.getByRole("dialog", { name: "Импорт учебных модулей" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the selected YAML file name and size and allows replacement", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Импортировать модули" }));
    fireEvent.change(screen.getByLabelText("Выберите YAML-файл"), {
      target: { files: [new File([new Uint8Array(1024)], "modules.yaml")] },
    });

    expect(screen.getByText("modules.yaml · 1.0 КиБ")).toBeInTheDocument();
    expect(screen.getByLabelText("Заменить файл")).toHaveAttribute("accept", ".yaml,.yml");
    fireEvent.change(screen.getByLabelText("Заменить файл"), {
      target: { files: [new File(["new"], "new-modules.yml")] },
    });
    expect(screen.getByText("new-modules.yml · 3 Б")).toBeInTheDocument();
    expect(screen.queryByText("modules.yaml · 1.0 КиБ")).not.toBeInTheDocument();
  });

  it("rejects unsupported extensions and clears the error when the file changes", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Импортировать модули" }));
    fireEvent.change(screen.getByLabelText("Выберите YAML-файл"), {
      target: { files: [new File(["text"], "modules.txt")] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Поддерживаются только файлы .yaml и .yml.");

    fireEvent.change(screen.getByLabelText("Заменить файл"), {
      target: { files: [new File(["yaml"], "modules.yml")] },
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Проверить файл" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("rejects files larger than 1 MiB", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Импортировать модули" }));
    fireEvent.change(screen.getByLabelText("Выберите YAML-файл"), {
      target: { files: [new File([new Uint8Array(1_048_577)], "large.yaml")] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Размер файла не должен превышать 1 МиБ.");
  });

  it("does not offer import for a read-only program", () => {
    render(<ImportContentPackageDialog programId="program-1" editable={false} />);
    expect(screen.queryByRole("button", { name: "Импортировать модули" })).not.toBeInTheDocument();
  });
});
