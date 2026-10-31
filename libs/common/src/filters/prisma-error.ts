export const PrismaErrorCode = {
  UniqueConstraint: "P2002",
  ForeignKeyConstraint: "P2003",
  RecordNotFound: "P2025",
} as const;

export function getPrismaErrorCode(error: unknown): string | undefined {
  if (error instanceof Error && "code" in error && typeof error.code === "string") {
    return error.code;
  }

  return undefined;
}

export function isPrismaError(error: unknown, code: string): boolean {
  return getPrismaErrorCode(error) === code;
}
