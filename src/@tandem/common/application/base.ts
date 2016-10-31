import { SequenceBus } from "mesh";
import { IActor, IInvoker } from '../actors';
import { IBrokerBus, BrokerBus } from "@tandem/common/busses";
import { LoadAction, InitializeAction } from "../actions";
import {
  Provider,
  Injector,
  PrivateBusProvider,
} from '../ioc';

/**
 * @deprecated
 */

export interface IApplication extends IInvoker {

  // the application configuration on startup
  readonly config: any;

  // actors of the application bus
  readonly bus: IBrokerBus;

  // parts of the application
  readonly injector: Injector;
}

/**
 */

export class Application2 {

  protected bus: IActor;
  private _initialized: boolean;

  constructor(readonly injector: Injector) {
    this.bus = PrivateBusProvider.getInstance(injector);
  }

  /**
   * Bootstraps the application
   */

  async initialize() {
    if (this._initialized) {
      throw new Error(`Attempting to initialize the application after it's already been initialized.`);
    }

    this._initialized = true;
    this.willLoad();

    // Prepare the application for initialization. Injector that
    // need to be loaded before being used by other injector should listen on this action
    // here.
    await this.bus.execute(new LoadAction());

    this.didLoad();
    this.willInitialize();

    // Notify the application that everything is ready
    await this.bus.execute(new InitializeAction());

    this.didInitialize();
  }

  /**
   */

  protected willLoad() {
    // OVERRIDE ME
  }

  /**
   */

  protected didLoad() {
    // OVERRIDE ME
  }

  /**
   */

  protected willInitialize() {
    // OVERRIDE ME
  }

  /**
   */

  protected didInitialize() {
    // OVERRIDE ME
  }
}