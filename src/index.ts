import { Store } from 'redux';

export interface Storage {
  get (key: string): string | null;
  set (key: string, data: string): void;
  remove (key: string): void;
}

export type Selector <SelectedState, Fullstate> = (state: Fullstate) => SelectedState;
export type Save <SelectedState> = (key: string, state: SelectedState, storage: Storage) => void;
export type Load <SelectedState> = (key: string, storage: Storage) => SelectedState | null;

export interface Options <FullState, SelectedState> {
  key: string;
  selector: Selector<SelectedState, FullState>;
  storage: Storage;
  save?: Save<SelectedState>;
  load?: Load<SelectedState>;
}

export interface Keep <FullState, SelectedState> extends Options<FullState, SelectedState> {
  save: Save<SelectedState>;
  load: Load<SelectedState>;
}

function createSave <S> (storage: Storage) {
  return (key: string, state: S) => state ? storage.set(key, JSON.stringify(state)) : storage.remove(key);
}

function createLoad <S> (storage: Storage) {
  return (key: string): S => {
    const data = storage.get(key);
    return data ? JSON.parse(data) : null;
  };
}

export function keep <F, S> (options: Options<F, S>): Keep<F, S> {
  const { key, selector, storage } = options;

  return {
    key,
    selector,
    storage,
    save: options.save || createSave(options.storage),
    load: options.load || createLoad(options.storage)
  };
}

export const HYDRATE = 'keep/HYDRATE';

export default function <FullState> (...keeps: Keep<FullState, any>[]) {
  return (store: Store<FullState>) => {

    const payload = keeps.reduce(
      (action, { key, storage, load }) => ({ ...action, [key]: load(key, storage), }),
      {}
    );

    store.dispatch({
      payload,
      type: HYDRATE
    });

    store.subscribe(() => {
      const state = store.getState();

      for (const { key, selector, storage, save } of keeps) {
        save(key, selector(state), storage);
      }
    });
  };
}
