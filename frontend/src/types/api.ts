export interface ApiErrorPayload {
    message?: string | string[];
    status?: number;
    conflicts?: unknown;
}
