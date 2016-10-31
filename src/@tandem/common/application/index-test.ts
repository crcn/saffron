import { expect } from "chai";
import { Application } from "./index";
import { LoadAction, InitializeAction } from "@tandem/common/actions";
import { BaseApplicationService } from "@tandem/common/services";
import { ApplicationSingletonProvider, ApplicationServiceProvider } from "@tandem/common/ioc";

describe(__filename + "#", () => {
  it("can be created", () => {
    new Application();
  });

  it("initializes a load, then initialize action", async () => {
    let i = 0;
    const app = new Application({});
    app.bus.register({
      execute(action) {
        if (action.type === LoadAction.LOAD) expect(i++).to.equal(0);
        if (action.type === InitializeAction.INITIALIZE) expect(i++).to.equal(1);
      }
    });

    await app.initialize();
    expect(i).to.equal(2);
  });

  it("can bind to the loading property", async () => {
    const app = new Application({});
  });

  it("registers application service injector upon initialization", async () => {
    const app = new Application({});
    let i = 0;
    let j = 0;

    class TestService extends BaseApplicationService<Application> {
      load() { i++; }
      initialize() { j++; }
    }

    app.injector.register(new ApplicationServiceProvider("testService", TestService));

    await app.initialize();
    expect(i).to.equal(1);
    expect(j).to.equal(1);
  });
});