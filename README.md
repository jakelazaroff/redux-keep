# redux-keep
Persist your Redux store to a cookie/local storage/wherever. Dead simple, no magic 🙅🏾‍♀️✨.

## Installation

```bash
npm install --save redux-keep
```

or

```bash
yarn add redux-keep
```

## Getting Started

redux-keep makes persisting your store easy by using two core Redux concepts: **selectors** and **reducers**.

### Saving your state

Selectors already decouple your components from the shape of your state, so why not have them do the same when you're persisting it?

**Note:** here we're creating the keeps in the same place as the store creation, but you can just as easily do it close to the reducers if you'd rather organize your modules that way.

```javascript
import { createStore } from 'redux';
import keepStore, { keep } from 'redux-keep';
import localStorage from 'redux-keep/dist/storage/localStorage';

import { selector, reducer } from './yourApp';

const keeps = [
  keep({
    key: 'saveMe',
    selector: selector,
    storage: localStorage
  });
];

const store = createStore(reducer);

keepStore(keeps)(store);
```

### Loading your state

Reducers are made to calculate new state, so why not let them figure out how to merge persisted state back in?

```javascript
import { REHYDRATE } from 'redux-keep';

export function reducer (state, action) {
  switch (action.type) {

    case REHYDRATE:
      return { ...action.payload.saveMe };

    default:
      return state;
  }
}
```

### Customizing

By default, your state will be stringified and parsed as JSON. If you need finer control over how your state is transformed, we accept two functions called just that!

```javascript
keep({
  key: 'immutable',
  selector: selector,
  storage: storage,
  save (key, data, storage) {
    if (data) {
      storage.set(key, JSON.stringify(Immutable.toJS(data)));
    } else {
      storage.remove(key);
    }
  },
  load (key, storage) {
    return Immutable.fromJS(JSON.parse(storage.get(key)));
  }
});
```

### Writing your own storage

Writing your own storage is easy! It's just an object with three functions: `get`, `set`, and `remove`:

```javascript
export const localStorage = {

  get (key) {
    return localStorage.getItem(key);
  },

  set (key, data) {
    localStorage.setItem(key, data);
  },

  remove (key) {
    localStorage.removeItem(key);
  }
};
```
