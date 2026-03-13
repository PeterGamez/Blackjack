export type AckType = (response: { ok: boolean } & Record<string, unknown>) => void;
