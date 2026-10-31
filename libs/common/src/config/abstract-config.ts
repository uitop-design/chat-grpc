export abstract class AbstractConfig {
  protected getString(key: string, defaultValue?: string): string {
    const value = process.env[key];

    if (value === undefined || value === "") {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      throw new TypeError(`Config key "${key}" MUST contain string. Got "${value ?? "undefined"}"`);
    }

    return value;
  }

  protected getSecret(key: string, minLength = 32): string {
    const value = this.getString(key);

    if (value.length < minLength) {
      throw new TypeError(`Config key "${key}" MUST contain at least ${minLength} characters`);
    }

    return value;
  }

  protected getNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];

    if (value === undefined || value === "") {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      throw new TypeError(`Config key "${key}" MUST contain valid number. Got "${value ?? "undefined"}"`);
    }

    const num = Number(value);

    if (!Number.isFinite(num)) {
      throw new TypeError(`Config key "${key}" MUST contain valid number. Got "${value}"`);
    }

    return num;
  }
}
