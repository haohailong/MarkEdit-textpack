import { MarkEdit } from 'markedit-api';
import { createTextpack, toBase64 } from './src/textpack.js';
import { messagesForLanguage } from './src/messages.js';

const messages = messagesForLanguage(navigator.languages?.[0] ?? navigator.language);

async function exportTextpack() {
  try {
    const markdown = MarkEdit.editorAPI.getText();
    const documentInfo = await MarkEdit.getFileInfo();
    const result = await createTextpack(markdown, documentInfo, {
      getFileObject: path => MarkEdit.getFileObject(path),
      homePath: MarkEdit.getDirectoryPath('home'),
    });

    const saved = await MarkEdit.showSavePanel({
      data: toBase64(result.archive),
      fileName: result.fileName,
    });
    if (!saved) return;

    const summary = [messages.included(result.assetCount)];
    if (result.missing.length) {
      summary.push(messages.missing(result.missing.length));
    }
    if (result.remoteCount) {
      summary.push(messages.external(result.remoteCount));
    }
    await MarkEdit.showAlert({ title: messages.successTitle, message: summary.join('\n') });
  } catch (error) {
    console.error('Textpack export failed', error);
    await MarkEdit.showAlert({
      title: messages.failureTitle,
      message: messages.failure(error instanceof Error ? error.message : String(error)),
    });
  }
}

MarkEdit.addMainMenuItem({
  title: messages.menuTitle,
  icon: 'doc.zipper',
  action: () => { void exportTextpack(); },
});
