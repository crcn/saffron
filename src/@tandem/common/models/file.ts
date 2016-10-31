import { IActor } from "@tandem/common/actors";
import {
  Injector,
  PrivateBusProvider,
  MimeTypeProvider,
  InjectorProvider,
} from "@tandem/common/ioc";
import { IDisposable } from "@tandem/common/object";

import { bindable, inject } from "@tandem/common/decorators";
import { Observable, watchProperty } from "@tandem/common/observable";


export class File extends Observable {

  @bindable()
  public path: string;

  @bindable()
  public mtime: number;

  @bindable()
  public content: string;

  readonly type: string;

  private _watcher: IDisposable;

  @inject(InjectorProvider.ID)
  protected _injector: Injector;

  @inject(PrivateBusProvider.ID)
  protected _bus: IActor;

  constructor() {
    super();
    // this.updateFromSourceData(data);
  }

  dispose() {
    if (this._watcher) {
      this._watcher.dispose();
      this._watcher = undefined;
    }
  }

  async save() {
    this.mtime = Date.now();
    // await UpdateTemporaryFileContentAction.execute(this, this._bus);
  }

  // static async open(path: string, injector: Injector, mimeType?: string): Promise<File> {
  //   const bus = PrivateBusProvider.getInstance(injector);
  //   const data = await ReadFileAction.execute(path, bus);
  //   const fileFactory = FileFactoryProvider.find(mimeType || MimeTypeProvider.lookup(path, injector), injector) || FileFactoryProvider.find("file", injector);
  //   return fileFactory.create(data);
  // }

  // protected updateFromSourceData(data: IFileModelActionResponseData) {
  //   Object.assign(this, data);
  // }

  // protected onFileDataChange(data: IFileModelActionResponseData) {
  //   this.updateFromSourceData(data);
  // }

  // sync() {
  //   this._watcher = WatchFileAction.execute(this.path, this._bus, this.onFileDataChange.bind(this));
  // }
}

// export const fileModelProvider = new FileFactoryProvider("file", File);