import { Bus } from 'mesh';

/**
 * proxies a target bus, and queues actions
 * if there is none until there is
 */

export default class ProxyBus extends Bus {
  constructor(target) {
    super();
    this._target = target;
    this._queue  = [];
  }

  execute(action) {

    // no target? put the action in a queue until there is
    if (this.paused) {
      return Response.create((writable) => {
        this._queue.push({
          action: action,
          writable: writable,
        });
      });
    }

    return this.target.execute(action);
  }

  get paused() {
    return this._paused || !this._target;
  }

  pause() {
    this._paused = true;
  }

  resume() {
    this._paused = false;
    this._drain();
  }

  get target() {
    return this._target;
  }

  set target(value) {
    this._target = value;

    // try draining the proxy now.
    this._drain();
  }

  _drain() {
    if (this.paused) return;
    while (this._queue.length) {
      var { writable, action } = this._queue.shift();
      this.target.execute(action).pipeTo(writable);
    }
  }
}
