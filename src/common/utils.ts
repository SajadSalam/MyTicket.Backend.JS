export interface SeatsioErrorResponse {
  status: number;
  messages: string[];
}

export function isSeatsioError(err: unknown): err is SeatsioErrorResponse {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    'messages' in err &&
    Array.isArray((err as SeatsioErrorResponse).messages)
  );
}
