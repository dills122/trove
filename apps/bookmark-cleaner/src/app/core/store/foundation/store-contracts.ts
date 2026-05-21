export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<TData, TError = string> {
  status: AsyncStatus;
  data: TData;
  error: TError | null;
}

export interface StoreResult<TData, TError = string> {
  ok: boolean;
  data?: TData;
  error?: TError;
}

export const successResult = <TData>(data: TData): StoreResult<TData> => ({ ok: true, data });

export const failureResult = <TError>(error: TError): StoreResult<never, TError> => ({
  ok: false,
  error,
});
