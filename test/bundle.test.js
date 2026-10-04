import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { strFromU8, unzipSync } from 'fflate';

test('built script exports corrected links and Traditional Chinese alerts', async () => {
  const script = readFileSync(new URL('../dist/markedit-textpack.js', import.meta.url), 'utf8');
  let menuItem;
  let saved;
  let alert;
  let resolveAlert;
  const alertShown = new Promise(resolve => { resolveAlert = resolve; });
  const reads = [];
  const MarkEdit = {
    editorAPI: { getText: () => [
      '![photo](images/a%29.png)',
      '[guide](guide.md#introduction)',
      '<img data-src="lazy.png" src="images/it%27s.png">',
    ].join('\n') },
    getFileInfo: async () => ({ filePath: '/docs/Example.md', parentPath: '/docs' }),
    getFileObject: async path => {
      reads.push(path);
      return { data: Buffer.from(path).toString('base64') };
    },
    getDirectoryPath: () => '/home',
    addMainMenuItem: item => { menuItem = item; },
    showSavePanel: async options => { saved = options; return true; },
    showAlert: async options => { alert = options; resolveAlert(); },
  };
  runInNewContext(script, {
    require: name => {
      assert.equal(name, 'markedit-api');
      return { MarkEdit };
    },
    navigator: { languages: ['zh-Hant-TW'] },
    atob,
    btoa,
    TextEncoder,
    TextDecoder,
    URL,
    document: {
      createElement: () => ({
        textContent: '',
        set innerHTML(value) { this.textContent = value === '&amp;' ? '&' : value; },
      }),
    },
    console,
  });

  assert.equal(menuItem.title, '匯出為 Textpack…');
  assert.equal(menuItem.icon, 'doc.zipper');
  menuItem.action();
  await alertShown;

  assert.deepEqual(reads, ['/docs/images/a).png', '/docs/guide.md', "/docs/images/it's.png"]);
  assert.equal(saved.fileName, 'Example.textpack');
  const archive = unzipSync(Buffer.from(saved.data, 'base64'));
  const markdown = strFromU8(archive['text.md']);
  assert.match(markdown, /!\[photo\]\(assets\/a%29\.png\)/);
  assert.match(markdown, /\[guide\]\(assets\/guide\.md#introduction\)/);
  assert.match(markdown, /<img data-src="lazy\.png" src="assets\/it%27s\.png">/);
  assert.equal(alert.title, 'Textpack 匯出完成');
  assert.match(alert.message, /已收錄 3 個本機資源/);
});
