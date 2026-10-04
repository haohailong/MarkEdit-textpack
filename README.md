# MarkEdit Textpack Export

Export a Markdown document from [MarkEdit](https://github.com/MarkEdit-app/MarkEdit) as a `.textpack` archive. The archive follows the [TextBundle v2 specification](https://textbundle.org/spec/) and contains `info.json`, `text.md`, and an `assets/` directory.

## Install

MarkEdit 1.36.0 or newer is required. Install **MarkEdit Textpack Export** from MarkEdit's Extension Manager, which uses the [official extension registry](https://markedit-app.github.io/extensions/). The Extension Manager installs the latest published release; source changes in this repository may not be published yet.

To install a build from this checkout manually:

1. Run `npm ci && npm run build`, or use the already-built [dist/markedit-textpack.js](dist/markedit-textpack.js).
2. In MarkEdit, choose **Open Documents Folder** and open its `scripts` folder.
3. Copy `dist/markedit-textpack.js` into `scripts`, then quit and relaunch MarkEdit.

## Export

Choose **Extensions → Export as Textpack…** (the document-with-zipper icon) and select a destination in MarkEdit's save panel. The suggested filename comes from the current document. Canceling the panel creates no file. Exporting does not modify the document.

The extension copies readable local files referenced by inline or reference-style Markdown images and links, plus quoted `src` attributes on HTML `<img>` elements and quoted `href` attributes on HTML `<a>` elements. Relative paths are resolved from the saved document's folder; absolute paths and local `file:` URLs are also supported. Each local file is stored once in `assets/`, and its links in `text.md` are rewritten to the bundled copy.

Rewritten asset filenames are URL-escaped so characters such as spaces, parentheses, and apostrophes remain safe in Markdown and quoted HTML attributes. Query strings and fragments, such as `?download=1` and `#introduction`, are preserved. HTML `data-src` and `data-href` are not treated as the actual `src` and `href` attributes.

Non-local links and unreadable local files keep their original links. The completion alert reports bundled files, unreadable files, and non-local links. If a file cannot be read, check its path and [grant MarkEdit access to its folder](https://github.com/MarkEdit-app/MarkEdit/wiki/Customization#grant-folder-access), then export again. An unsaved document can be exported, but its relative file paths cannot be resolved. The extension reads referenced local files through the [MarkEdit API](https://github.com/MarkEdit-app/MarkEdit-api); it does not contact an external service.

## Interface languages

The menu item and all extension-generated success, failure, and partial-export messages are available in English, Simplified Chinese, and Traditional Chinese. `zh-Hant`, `zh-TW`, `zh-HK`, and `zh-MO` use Traditional Chinese; `zh-Hans`, `zh-CN`, `zh-SG`, and an unspecified `zh` locale use Simplified Chinese. Other locales fall back to English. MarkEdit's native save panel follows the app or system language.

## Development

- `npm test` rebuilds the script, then runs archive, link-rewriting, HTML-attribute, localization, and built-script tests.
- `npm run build` produces a single-file CommonJS script in `dist/`.

The distribution script bundles its runtime dependencies, including `fflate` and `mdast-util-from-markdown`; `markedit-api` is supplied by MarkEdit. The build includes third-party MIT license notices in the generated JavaScript.

## License

MIT. See [LICENSE](LICENSE).

## 简体中文

在 MarkEdit 的扩展管理器中安装 **MarkEdit Textpack Export**，或将 [dist/markedit-textpack.js](dist/markedit-textpack.js) 放入 MarkEdit Documents 文件夹下的 `scripts` 目录并重启应用。从 **Extensions → 导出为 Textpack…** 导出当前文档。可读取的本地图片与附件会打包到 `assets/`；无法读取的文件和非本地链接保持原样。导出后的提示会说明收录及遗漏情况。若要使用尚未发布的源码修改，请先运行 `npm ci && npm run build`。

## 繁體中文

在 MarkEdit 的擴充功能管理器中安裝 **MarkEdit Textpack Export**，或將 [dist/markedit-textpack.js](dist/markedit-textpack.js) 放入 MarkEdit Documents 資料夾下的 `scripts` 目錄並重新啟動應用程式。從 **Extensions → 匯出為 Textpack…** 匯出目前的文件。可讀取的本機圖片與附件會封裝到 `assets/`；無法讀取的檔案和非本機連結維持不變。匯出完成後會顯示收錄及遺漏情況。若要使用尚未發佈的原始碼變更，請先執行 `npm ci && npm run build`。
