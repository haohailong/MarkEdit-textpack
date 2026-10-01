import assert from 'node:assert/strict';
import test from 'node:test';
import { messagesForLanguage } from '../src/messages.js';

test('provides complete English copy, including singular and plural outcomes', () => {
  const messages = messagesForLanguage('en-AU');
  assert.equal(messages.menuTitle, 'Export as Textpack…');
  assert.equal(messages.successTitle, 'Textpack export complete');
  assert.equal(messages.failureTitle, 'Textpack export failed');
  assert.match(messages.included(1), /1 local asset included/);
  assert.match(messages.included(2), /2 local assets included/);
  assert.match(messages.missing(1), /Its original link was left unchanged/);
  assert.match(messages.missing(2), /Their original links were left unchanged/);
  assert.match(messages.external(1), /1 non-local link remains unchanged/);
  assert.match(messages.external(2), /2 non-local links remain unchanged/);
  assert.match(messages.failure('Disk full'), /The document could not be exported\. Disk full/);
});

test('selects Simplified or Traditional Chinese by script and region', () => {
  for (const language of ['zh', 'zh-CN', 'zh-SG', 'zh-Hans', 'zh-Hans-TW']) {
    assert.equal(messagesForLanguage(language).menuTitle, '导出为 Textpack…', language);
  }
  for (const language of ['zh-Hant', 'zh-TW', 'zh-HK', 'zh-MO', 'zh-Hant-CN']) {
    assert.equal(messagesForLanguage(language).menuTitle, '匯出為 Textpack…', language);
  }
  assert.equal(messagesForLanguage('fr-FR').successTitle, 'Textpack export complete');
  assert.equal(messagesForLanguage(undefined).successTitle, 'Textpack export complete');
});

test('provides Traditional Chinese text for the full export flow', () => {
  const messages = messagesForLanguage('zh-Hant-TW');
  assert.equal(messages.menuTitle, '匯出為 Textpack…');
  assert.equal(messages.successTitle, 'Textpack 匯出完成');
  assert.equal(messages.failureTitle, 'Textpack 匯出失敗');
  assert.equal(messages.included(2), '已收錄 2 個本機資源。');
  assert.match(messages.missing(1), /1 個本機資源無法讀取，原始連結已保留/);
  assert.match(messages.missing(1), /請檢查檔案位置，或授予 MarkEdit 存取其所在資料夾的權限/);
  assert.equal(messages.external(2), '2 個非本機連結維持不變。');
  assert.equal(messages.failure('磁碟已滿'), '無法匯出目前的文件。磁碟已滿');
});
