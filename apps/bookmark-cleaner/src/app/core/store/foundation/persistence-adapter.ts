export interface ReadablePersistenceAdapter<T> {
  read(): Promise<T | null> | T | null;
}

export interface WritablePersistenceAdapter<T> {
  write(value: T): Promise<boolean> | boolean;
}

export type PersistenceAdapter<T> = ReadablePersistenceAdapter<T> & WritablePersistenceAdapter<T>;
