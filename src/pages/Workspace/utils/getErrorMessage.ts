export default function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") {
    try {
      const parsed: unknown = JSON.parse(error);
      if (
        parsed &&
        typeof parsed === "object" &&
        "message" in parsed &&
        typeof parsed.message === "string"
      ) {
        return parsed.message;
      }
    } catch {
      return error;
    }
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = error.message;
    if (typeof message === "string") return message;
  }
  return JSON.stringify(error) ?? String(error);
}
