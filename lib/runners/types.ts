export interface RunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  /** false when the runner itself could not be reached (offline, disabled...). */
  available: boolean;
}

/** One implementation per language. Register it in lib/runners/index.ts. */
export interface LanguageRunner {
  id: string;
  run(code: string): Promise<RunResult>;
}
