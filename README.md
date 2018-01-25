# redux-keep

Persist your Redux store to a cookie/local storage/wherever you want. Dead simple, no magic 🙅🏾‍♀️✨.

[redux-persist](https://www.npmjs.com/package/redux-persist) is powerful, but the API is big and there are a lot of things to learn. redux-keep has a simple API and reuses concepts already central to redux so you can get in, get out and get on with your life.

## Installation

```bash
npm install --save redux-keep
```

or

```bash
yarn add redux-keep
```

## Getting Started 🏎

redux-keep makes persisting your store simple by using two core Redux concepts: **selectors** and **reducers**.

### Saving your state 💾

Selectors already decouple your components from the shape of your state, so why not have them do the same when you're persisting it?

Every time your store updates, redux-keep gets the output of your selector and persists it. It's smart, so it won't run again if the output doesn't change!

**Note:** here we're creating the keeps in the same place as the store creation, but you can just as easily do it close to the reducers if you'd rather organize your modules that way.

```javascript
import { createStore } from 'redux';
import keepStore, { keep } from 'redux-keep';
import localStorage from 'redux-keep/dist/storage/localStorage';

import { selector, reducer } from './yourApp';

const keeps = [
  keep({
    key: 'saveMe', // where to persist your state
    selector: selector, // what state to persist
    storage: localStorage // what storage engine to use
  });
];

const store = createStore(reducer);

keepStore(keeps)(store);
```

### Loading your state 🔄

Reducers are made to calculate new state, so why not let them figure out how to merge persisted state back in?

When you call `keepStore`, redux-keep will load the persisted state and dispatch it as the payload of an action with type `HYDRATE`. The persisted state will be available under the key specified in the keep options.

```javascript
import { HYDRATE } from 'redux-keep';

export function reducer (state, action) {
  switch (action.type) {

    case HYDRATE:
      return { ...action.payload.saveMe };

    default:
      return state;
  }
}
```

### Customizing 👩🏼‍🔧

By default, your state will be stringified and parsed as JSON. If you need finer control over how your state is transformed, you can specify `save` and `load` functions:

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

### Writing your own storage 👨🏿‍🔬

Writing your own storage is simple! It's just an object with three functions: `get`, `set`, and `remove`. They'll each receive the keep's key as the first argument.

`get` should return the persisted state — preferably as a string, since the default `load` function tries to parse it as JSON!

`set` receives the output of the selector as its second argument. Unless you use a custom `save` function, it'll already by stringified.

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
