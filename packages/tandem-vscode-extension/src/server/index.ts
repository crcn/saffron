import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  InitializedParams,
  Connection,
  Diagnostic,
  TextDocumentSyncKind,
  TextDocumentPositionParams,
  CompletionParams,
  DiagnosticSeverity
} from "vscode-languageserver";

import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Engine,
  EngineEvent,
  EngineEventKind,
  SourceLocation,
  EngineErrorEvent,
  EngineErrorKind,
  GraphErrorEvent,
  RuntimeErrorEvent
} from "paperclip";
import {
  LoadParams,
  NotificationType,
  EngineEventNotification
} from "../common/notifications";

const PAPERCLIP_RENDER_PART = "tandem:preview";

const connection = createConnection(ProposedFeatures.all);

const documents: TextDocuments<any> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      // Tell the client that the server supports code completion
      completionProvider: {
        resolveProvider: true
      }
    }
  };
});

const initEngine = async (
  connection: Connection,
  documents: TextDocuments<TextDocument>
) => {
  const engine = new Engine({
    renderPart: PAPERCLIP_RENDER_PART
  });

  const handleGraphError = ({ file_path: filePath, info }: GraphErrorEvent) => {
    const textDocument = documents.get(`file://${filePath}`);
    if (!textDocument) {
      return;
    }

    const diagnostics: Diagnostic[] = [
      {
        severity: DiagnosticSeverity.Error,
        range: {
          start: textDocument.positionAt(info.location.start),
          end: textDocument.positionAt(info.location.end)
        },
        message: `${info.message}`,
        source: "ex"
      }
    ];

    connection.sendDiagnostics({
      uri: textDocument.uri,
      diagnostics
    });
  };

  const handleRuntimeError = (event: RuntimeErrorEvent) => {};

  const createErrorDiagnostic = (message: string, location: SourceLocation) => {
    return {
      severity: DiagnosticSeverity.Error,
      range: {
        start: textDocument.positionAt(info.location.start),
        end: textDocument.positionAt(info.location.end)
      },
      message: `${info.message}`,
      source: "ex"
    };
  };

  const handleEngineError = (event: EngineErrorEvent) => {
    switch (event.error_kind) {
      case EngineErrorKind.Graph:
        return handleGraphError(event);
      case EngineErrorKind.Runtime:
        return handleRuntimeError(event);
    }
  };

  engine.onEvent((event: EngineEvent) => {
    if (event.kind == EngineEventKind.Error) {
      handleEngineError(event);
    } else {
      // reset diagnostics
      if (event.kind === EngineEventKind.Evaluated) {
        connection.sendDiagnostics({
          uri: `file://${event.file_path}`,
          diagnostics: []
        });
      }

      connection.sendNotification(
        ...new EngineEventNotification(event).getArgs()
      );
    }
  });
  connection.onNotification(
    NotificationType.LOAD,
    ({ filePath }: LoadParams) => {
      engine.load(filePath);
    }
  );
  connection.onNotification(
    NotificationType.UNLOAD,
    ({ filePath }: LoadParams) => {
      engine.unload(filePath);
    }
  );

  documents.onDidChangeContent(event => {
    const doc: TextDocument = event.document;
    engine.updateVirtualFileContent(doc.uri, doc.getText());
  });
};

connection.onInitialized((params: InitializedParams) => {
  initEngine(connection, documents);
});

documents.listen(connection);
connection.listen();

connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams) => {
  return [];
});
