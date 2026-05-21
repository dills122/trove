import { createHistoryState, pushHistory, redoHistory, undoHistory } from './history-state';

describe('history-state', () => {
  it('tracks push/undo/redo transitions', () => {
    let state = createHistoryState(1);

    state = pushHistory(state, 2);
    state = pushHistory(state, 3);

    expect(state.present).toBe(3);
    expect(state.past).toEqual([1, 2]);

    state = undoHistory(state);
    expect(state.present).toBe(2);

    state = redoHistory(state);
    expect(state.present).toBe(3);
  });

  it('caps past history length', () => {
    let state = createHistoryState(0);
    for (let i = 1; i <= 5; i += 1) {
      state = pushHistory(state, i, { maxPast: 2 });
    }

    expect(state.past).toEqual([3, 4]);
    expect(state.present).toBe(5);
  });
});
