// libraries
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

chai.should();
chai.use(sinonChai);

import keepStore, { keep, HYDRATE, Options, Storage } from './index';

interface Action {
  type: string;
  payload: any;
}

type SelectedState = { a: number; };
interface FullState {
  persistent: SelectedState;
  transient: { a: number; };
}

describe('redux-keep', () => {

  let selector: (state: FullState) => SelectedState;
  let storage: Storage;
  let config: Options<FullState, SelectedState>;

  beforeEach(() => {
    selector = sinon.stub().returns({ a: 1 });

    storage = {
      get: sinon.stub().returns('{ "a": 1}'),
      set: sinon.stub(),
      remove: sinon.stub()
    };

    config = {
      key: 'key',
      selector,
      storage
    };
  });

  describe('keep', () => {

    describe('key', () => {

      it('should be preserved', () => {
        keep(config).key.should.equal(config.key);
      });
    });

    describe('selector', () => {

      it('should be preserved', () => {
        keep(config).selector.should.equal(config.selector);
      });
    });

    describe('storage', () => {

      it('should be preserved', () => {
        keep(config).storage.should.equal(config.storage);
      });
    });

    describe('save', () => {

      describe('default', () => {

        it('should call storage.set with JSONified data if data is defined', () => {
          const data = { a: 1 };
          keep(config).save(config.key, data, config.storage);

          config.storage.set.should.be.calledOnce;
          config.storage.set.should.be.calledWith(config.key, JSON.stringify(data));
        });

        it('should call storage.remove if data is undefined', () => {
          keep(config).save(config.key, undefined, config.storage);

          config.storage.remove.should.be.calledOnce;
          config.storage.remove.should.be.calledWith(config.key);
        });
      });

      describe('custom', () => {

        it('should be preserved', () => {
          const save = sinon.stub();

          keep({
            ...config,
            save
          }).save.should.equal(save);
        });
      });
    });

    describe('load', () => {

      describe('default', () => {

        it('should parse the result of storage.get and return it', () => {
          const result = keep(config).load(config.key, config.storage);

          config.storage.get.should.be.calledOnce;
          config.storage.get.should.be.calledWith(config.key);
          result.should.eql({ a: 1 });
        });
      });

      describe('custom', () => {

        it('should be preserved', () => {
          const load = sinon.stub();

          keep({
            ...config,
            load
          }).load.should.equal(load);
        });
      });
    });
  });

  describe('keepStore', () => {

    let state: object;
    let actions: Action[];
    let listeners: Array<() => void>;
    let store;
    beforeEach(() => {
      state = {};
      actions = [];
      listeners = [];
      store = {
        dispatch (action: Action) { actions.push(action); },
        getState () { return state; },
        subscribe (listener: () => void) { listeners.push(listener); }
      };
    });

    describe('hydrate', () => {

      it('should load data from the keeps', () => {
        const _keep = keep(config);
        sinon.stub(_keep, 'load');

        keepStore(_keep)(store);

        _keep.load.should.be.calledOnce;
        _keep.load.should.be.calledWith(config.key);
      });

      it('should dispatch an action with the loaded data', () => {
        const data = { a: 1 };
        const _keep = keep(config);
        sinon.stub(_keep, 'load').returns(data);

        keepStore(_keep)(store);

        _keep.load.should.be.calledWith(config.key);

        actions.should.have.lengthOf(1);
        actions[0].should.eql({
          type: HYDRATE,
          payload: {
            [config.key]: data
          }
        });
      });
    });

    describe('persist', () => {

      let _selector: sinon.SinonStub;

      function notify () {
        for (const listener of listeners) {
          listener();
        }
      }

      beforeEach(() => {
        _selector = selector as sinon.SinonStub;
      });

      it(`should call each keep's save with the output of its selector`, () => {
        const _keep = keep(config);
        sinon.stub(_keep, 'save');

        const selected = { a: 1 };
        _selector.returns(selected);

        keepStore(_keep)(store);
        notify();

        _selector.should.be.calledOnce;
        _selector.should.be.calledWith(state);

        _keep.save.should.be.calledOnce;
        _keep.save.should.be.calledWith(_keep.key, selected, _keep.storage);
      });

      it(`should not call a keep's save if its selector output hasn't changed`, () => {
        const _keep = keep(config);
        sinon.stub(_keep, 'save');

        const selected = { a: 1 };
        _selector.returns(selected);

        keepStore(_keep)(store);
        notify();
        (_keep.save as sinon.SinonStub).reset();
        notify();

        _selector.should.be.calledTwice;
        _selector.should.be.calledWith(state);

        _keep.save.should.not.be.called;
      });
    });
  });
});
