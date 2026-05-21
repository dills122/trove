export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface HistoryOptions {
  maxPast?: number;
}

export const createHistoryState = <T>(initial: T): HistoryState<T> => ({
  past: [],
  present: initial,
  future: [],
});

export const pushHistory = <T>(
  state: HistoryState<T>,
  next: T,
  options: HistoryOptions = {},
): HistoryState<T> => {
  const maxPast = options.maxPast ?? 100;
  const past = [...state.past, state.present];
  const trimmedPast = past.length > maxPast ? past.slice(past.length - maxPast) : past;

  return {
    past: trimmedPast,
    present: next,
    future: [],
  };
};

export const undoHistory = <T>(state: HistoryState<T>): HistoryState<T> => {
  if (state.past.length === 0) {
    return state;
  }

  const previous = state.past[state.past.length - 1];
  return {
    past: state.past.slice(0, -1),
    present: previous,
    future: [state.present, ...state.future],
  };
};

export const redoHistory = <T>(state: HistoryState<T>): HistoryState<T> => {
  if (state.future.length === 0) {
    return state;
  }

  const [next, ...remainingFuture] = state.future;
  return {
    past: [...state.past, state.present],
    present: next,
    future: remainingFuture,
  };
};
