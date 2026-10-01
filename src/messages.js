const english = {
  menuTitle: 'Export as Textpack…',
  successTitle: 'Textpack export complete',
  failureTitle: 'Textpack export failed',
  included: count => `${count} local ${count === 1 ? 'asset' : 'assets'} included.`,
  missing: count => `${count} local ${count === 1 ? 'asset could' : 'assets could'} not be read. ${count === 1 ? 'Its original link was' : 'Their original links were'} left unchanged. Check the file location or grant MarkEdit access to its folder.`,
  external: count => `${count} non-local ${count === 1 ? 'link remains' : 'links remain'} unchanged.`,
  failure: detail => `The document could not be exported. ${detail}`,
};

const simplifiedChinese = {
  menuTitle: '导出为 Textpack…',
  successTitle: 'Textpack 导出完成',
  failureTitle: 'Textpack 导出失败',
  included: count => `已收录 ${count} 个本地资源。`,
  missing: count => `${count} 个本地资源未能读取，原链接已保留。请检查文件位置或在 MarkEdit 中授权所在文件夹。`,
  external: count => `${count} 个非本地链接保持原样。`,
  failure: detail => `无法导出当前文档。${detail}`,
};

const traditionalChinese = {
  menuTitle: '匯出為 Textpack…',
  successTitle: 'Textpack 匯出完成',
  failureTitle: 'Textpack 匯出失敗',
  included: count => `已收錄 ${count} 個本機資源。`,
  missing: count => `${count} 個本機資源無法讀取，原始連結已保留。請檢查檔案位置，或授予 MarkEdit 存取其所在資料夾的權限。`,
  external: count => `${count} 個非本機連結維持不變。`,
  failure: detail => `無法匯出目前的文件。${detail}`,
};

export function messagesForLanguage(language) {
  const subtags = (language || '').toLowerCase().split('-');
  if (subtags[0] !== 'zh') return english;
  if (subtags.includes('hant') || (!subtags.includes('hans') &&
    subtags.some(subtag => ['tw', 'hk', 'mo'].includes(subtag)))) {
    return traditionalChinese;
  }
  return simplifiedChinese;
}
