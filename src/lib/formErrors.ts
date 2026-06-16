import { ApiRequestError, type ApiFieldErrors } from "@/lib/api";

export function clearFormErrors() {
  return { fieldErrors: {} as ApiFieldErrors, generalError: undefined as string | undefined };
}

export function applyMutationFormErrors(
  error: unknown,
  setFieldErrors: (errors: ApiFieldErrors) => void,
  setGeneralError: (message: string | undefined) => void,
) {
  if (error instanceof ApiRequestError) {
    setFieldErrors(error.fieldErrors);
    const hasFieldErrors = Object.keys(error.fieldErrors).length > 0;
    setGeneralError(
      error.generalError ?? (!hasFieldErrors ? error.message : undefined),
    );
    return;
  }

  if (error instanceof Error) {
    setGeneralError(error.message);
    return;
  }

  setGeneralError("Something went wrong. Please try again.");
}

export function fieldError(
  fieldErrors: ApiFieldErrors,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    if (fieldErrors[key]) return fieldErrors[key];
  }
  return undefined;
}
