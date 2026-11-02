import { BadRequestException, ValidationError, ValidationPipe } from "@nestjs/common";

function collectMessages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [...Object.values(error.constraints ?? {}), ...collectMessages(error.children ?? [])]);
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    exceptionFactory: (errors) => new BadRequestException(collectMessages(errors).join(" / ")),
  });
}
