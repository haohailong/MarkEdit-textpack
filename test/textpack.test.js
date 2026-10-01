import assert from 'node:assert/strict';
import test from 'node:test';
import { strFromU8, unzipSync } from 'fflate';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { createTextpack } from '../src/textpack.js';

test('exports a TextBundle v2 ZIP, deduplicates assets, and preserves code examples', async () => {
  const markdown = [
    '# Example',
    '',
    '![first](images/photo%20one.png "caption")',
    '![second][shared]',
    '![third](images/photo%20one.png)',
    '',
    '[shared]: images/chart.png',
    '',
    '`![code](images/ignore.png)`',
    '',
    '```md',
    '![fence](images/ignore.png)',
    '```',
    '',
  ].join('\n');
  const reads = [];
  const image = data => ({ data: Buffer.from(data).toString('base64') });
  const files = new Map([
    ['/docs/images/photo one.png', image('photo')],
    ['/docs/images/chart.png', image('chart')],
  ]);
  const result = await createTextpack(markdown, {
    filePath: '/docs/Example.md', parentPath: '/docs',
  }, {
    getFileObject: async path => { reads.push(path); return files.get(path); },
  });
  const archive = unzipSync(result.archive);
  const text = strFromU8(archive['text.md']);
  const info = JSON.parse(strFromU8(archive['info.json']));

  assert.equal(result.fileName, 'Example.textpack');
  assert.equal(info.version, 2);
  assert.equal(info.type, 'net.daringfireball.markdown');
  assert.deepEqual(reads, ['/docs/images/photo one.png', '/docs/images/chart.png']);
  assert.equal(result.assetCount, 2);
  assert.equal(result.missing.length, 0);
  assert.match(text, /!\[first\]\(assets\/photo%20one\.png "caption"\)/);
  assert.match(text, /\[shared\]: assets\/chart\.png/);
  assert.match(text, /`!\[code\]\(images\/ignore\.png\)`/);
  assert.match(text, /!\[fence\]\(images\/ignore\.png\)/);
  assert.equal(strFromU8(archive['assets/photo one.png']), 'photo');
  assert.equal(strFromU8(archive['assets/chart.png']), 'chart');
});

test('keeps remote and unreadable references and resolves file URLs', async () => {
  const source = '![web](https://example.org/x.png)\n![lost](missing.png)\n<img src="file:///docs/a.png">';
  const result = await createTextpack(source, { parentPath: '/docs' }, {
    getFileObject: async path => path === '/docs/a.png'
      ? { data: Buffer.from('binary').toString('base64') }
      : undefined,
  });
  const archive = unzipSync(result.archive);
  const text = strFromU8(archive['text.md']);
  assert.match(text, /https:\/\/example\.org\/x\.png/);
  assert.match(text, /!\[lost\]\(missing\.png\)/);
  assert.match(text, /<img src="assets\/a\.png">/);
  assert.equal(result.remoteCount, 1);
  assert.deepEqual(result.missing, ['missing.png']);
});

test('includes linked local attachments and leaves web links alone', async () => {
  const source = '[report](files/report.pdf) [web](https://example.org)\n<a href="files/data.csv">data</a>';
  const result = await createTextpack(source, { parentPath: '/docs' }, {
    getFileObject: async path => ({ data: Buffer.from(path).toString('base64') }),
  });
  const archive = unzipSync(result.archive);
  const text = strFromU8(archive['text.md']);
  assert.match(text, /\[report\]\(assets\/report\.pdf\)/);
  assert.match(text, /<a href="assets\/data\.csv">/);
  assert.match(text, /\[web\]\(https:\/\/example\.org\)/);
  assert.equal(result.assetCount, 2);
});

test('continues after a read error and avoids duplicate asset names', async () => {
  const source = '![one](one/a.png) ![two](two/a.png) ![bad](denied.png)';
  const result = await createTextpack(source, { parentPath: '/docs' }, {
    getFileObject: async path => {
      if (path === '/docs/denied.png') throw new Error('access denied');
      return { data: Buffer.from(path).toString('base64') };
    },
  });
  const archive = unzipSync(result.archive);
  const text = strFromU8(archive['text.md']);
  assert.match(text, /!\[one\]\(assets\/a\.png\)/);
  assert.match(text, /!\[two\]\(assets\/a-2\.png\)/);
  assert.match(text, /!\[bad\]\(denied\.png\)/);
  assert.equal(result.assetCount, 2);
  assert.deepEqual(result.missing, ['denied.png']);
});

test('includes a readable empty local file', async () => {
  const result = await createTextpack('[empty](empty.txt)', { parentPath: '/docs' }, {
    getFileObject: async () => ({ data: '' }),
  });
  const archive = unzipSync(result.archive);
  assert.ok(Object.hasOwn(archive, 'assets/empty.txt'));
  assert.equal(archive['assets/empty.txt'].length, 0);
  assert.equal(result.assetCount, 1);
  assert.deepEqual(result.missing, []);
  assert.match(strFromU8(archive['text.md']), /\[empty\]\(assets\/empty\.txt\)/);
});

test('escapes filenames that are unsafe in bare Markdown destinations and quoted HTML attributes', async () => {
  const source = [
    '![parenthesis](images/a%29.png)',
    '[apostrophe](images/it%27s.png)',
    "<img src='images/it%27s.png'>",
    "<a href='images/a%29.png'>file</a>",
  ].join('\n');
  const reads = [];
  const result = await createTextpack(source, { parentPath: '/docs' }, {
    getFileObject: async path => {
      reads.push(path);
      return { data: Buffer.from(path).toString('base64') };
    },
  });
  const archive = unzipSync(result.archive);
  const text = strFromU8(archive['text.md']);
  assert.deepEqual(reads, ['/docs/images/a).png', "/docs/images/it's.png"]);
  assert.match(text, /!\[parenthesis\]\(assets\/a%29\.png\)/);
  assert.match(text, /\[apostrophe\]\(assets\/it%27s\.png\)/);
  assert.match(text, /<img src='assets\/it%27s\.png'>/);
  assert.match(text, /<a href='assets\/a%29\.png'>/);
  const parsed = fromMarkdown(text);
  const links = parsed.children[0].children.filter(node => node.type === 'image' || node.type === 'link');
  assert.deepEqual(links.map(node => node.url), ['assets/a%29.png', 'assets/it%27s.png']);
  assert.equal(result.assetCount, 2);
});

test('rewrites the real src attribute when data-src and misleading quoted text are present', async () => {
  const source = [
    '<img data-src="lazy.png" title="not src=\'wrong.png\' >" src="photo.png" alt="Picture">',
    '<a data-href="preview.md" href="guide.md">Guide</a>',
  ].join('\n');
  const reads = [];
  const result = await createTextpack(source, { parentPath: '/docs' }, {
    getFileObject: async path => {
      reads.push(path);
      return { data: Buffer.from(path).toString('base64') };
    },
  });
  const archive = unzipSync(result.archive);
  assert.deepEqual(reads, ['/docs/photo.png', '/docs/guide.md']);
  assert.equal(strFromU8(archive['text.md']), [
    '<img data-src="lazy.png" title="not src=\'wrong.png\' >" src="assets/photo.png" alt="Picture">',
    '<a data-href="preview.md" href="assets/guide.md">Guide</a>',
  ].join('\n'));
  assert.equal(result.assetCount, 2);
});

test('preserves fragments and query strings on rewritten local links', async () => {
  const source = [
    '[guide](guide.md#introduction)',
    '[download][file]',
    '[file]: files/report.pdf?download=1#page=2',
    '<a href="guide.md#summary">Summary</a>',
    '<img src="photo.png?size=2&amp;mode=preview#thumbnail">',
  ].join('\n\n');
  const result = await createTextpack(source, { parentPath: '/docs' }, {
    getFileObject: async path => ({ data: Buffer.from(path).toString('base64') }),
  });
  const archive = unzipSync(result.archive);
  const text = strFromU8(archive['text.md']);
  assert.match(text, /\[guide\]\(assets\/guide\.md#introduction\)/);
  assert.match(text, /\[file\]: assets\/report\.pdf\?download=1#page=2/);
  assert.match(text, /<a href="assets\/guide\.md#summary">/);
  assert.match(text, /<img src="assets\/photo\.png\?size=2&amp;mode=preview#thumbnail">/);
  assert.equal(result.assetCount, 3);
});
