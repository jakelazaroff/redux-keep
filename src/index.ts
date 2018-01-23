import { Store } from 'redux';

export interface Storage {
  get (key: string): string | null;
  set (key: string, data: string): void;
  remove (key: string): void;
}

export type Selector <SelectedState, Fullstate> = (state: Fullstate) => SelectedState;
export type Save <SelectedState> = (key: string, state: SelectedState) => void;
export type Load <SelectedState> = (key: string) => SelectedState | null;

export interface BaseOptions <FullState, SelectedState> {
  key: string;
  selector: Selector<SelectedState, FullState>;
}

export interface StorageOptions <Fullstate, SelectedState> extends BaseOptions<Fullstate, SelectedState> {
  storage: Storage;
  save?: Save<SelectedState>;
  load?: Load<SelectedState>;
}

export interface CustomOptions <Fullstate, SelectedState> extends BaseOptions<Fullstate, SelectedState> {
  save: Save<SelectedState>;
  load: Load<SelectedState>;
}

export interface Keep <FullState, SelectedState> {
  key: string;
  selector: Selector<SelectedState, FullState>;
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

export function keep <F, S> (options: StorageOptions<F, S> | CustomOptions<F, S>): Keep<F, S> {
  const { key, selector } = options;

  return {
    key,
    selector,
    save: options.save || createSave((options as StorageOptions<F, S>).storage),
    load: options.load || createLoad((options as StorageOptions<F, S>).storage)
  };
}

export const HYDRATE = 'keep/HYDRATE';

export default function <FullState> (...keeps: Keep<FullState, any>[]) {
  return (store: Store<FullState>) => {

    const payload = keeps.reduce(
      (action, { key, load }) => ({ ...action, [key]: load(key), }),
      {}
    );

    store.dispatch({
      payload,
      type: HYDRATE
    });

    store.subscribe(() => {
      const state = store.getState();

      for (const { key, selector, save } of keeps) {
        save(key, selector(state));
      }
    });
  };
}
