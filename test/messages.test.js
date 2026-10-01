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

test('uses Chinese for Chinese locales and English for other locales', () => {
  assert.match(messagesForLanguage('zh-CN').successTitle, /导出完成/);
  assert.equal(messagesForLanguage('fr-FR').successTitle, 'Textpack export complete');
  assert.equal(messagesForLanguage(undefined).successTitle, 'Textpack export complete');
});
