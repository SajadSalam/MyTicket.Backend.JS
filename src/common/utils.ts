export interface SeatsioErrorResponse {
  status: number;
  messages: string[];
}

export function isSeatsioError(err: unknown): err is SeatsioErrorResponse {
  console.log("isSeatsioError", err);
  /*isSeatsioError {
  status: 404,
  messages: [ 'object not found: A-1' ],
  errors: [ { code: 'OBJECT_NOT_FOUND', message: 'object not found: A-1' } ],
  warnings: [],
  requestId: 'd716703b-b1bd-407f-a5ab-dd700554a0fe'
}*/
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    'messages' in err &&
    Array.isArray((err as SeatsioErrorResponse).messages)
  );
}
