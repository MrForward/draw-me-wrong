export type UseCaseId = "team";

export function normalizeUseCase(value: unknown): UseCaseId | null {
  return value === "team" ? value : null;
}
