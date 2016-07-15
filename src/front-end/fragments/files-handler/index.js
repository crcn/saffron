import { ApplicationFragment } from 'common/application/fragments';
import { INITIALIZE } from 'common/application/events';
import { RouterBus } from 'common/busses';
import OpenFilesCollection from './open-files-collection';
import sift from 'sift';

export const fragment = ApplicationFragment.create({
  ns: 'application/fileHandler',
  initialize: create,
});

function create(app) {
  app.busses.push(
    RouterBus.create({
      [INITIALIZE]: initialize,
      updateFileData: openFile,
    })
  );

  const logger = app.logger.createChild({ prefix: 'file handler: ' });
  const openFiles = OpenFilesCollection.create({ bus: app.bus });

  async function initialize() {
    await getOpenFiles();
  }

  async function getOpenFiles() {
    var files = await app.bus.execute({
      type: 'getOpenFiles',
      public: true,
    }).readAll();

    for (const file of files) {
      await openFile({ file });
    }
  }

  async function openFile({ file }) {

    var model = openFiles.find(sift({ path: file.path }));

    if (model) {
      logger.info('updating file %s', file.path);
      model.setProperties(file);
      return;
    }

    model = (await app.bus.execute({
      type: 'createFileModel',
      file: file,
    }).readAll())[0];

    if (!model) {
      logger.error('cannot open file %s', file.path);
      return;
    }

    openFiles.push(model);

    // temporary
    app.setProperties({ currentFile: model });
  }
}
