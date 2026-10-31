import { config } from "dotenv";

export function loadEnv(app: string): void {
  config({ path: [`apps/${app}/.env`], quiet: true });
}
