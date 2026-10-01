# MarkEdit Textpack Export

Export the current Markdown document from MarkEdit as a `.textpack` archive. The output follows the [TextBundle v2 specification](https://textbundle.org/spec/): the ZIP root contains `info.json`, `text.md`, and `assets/`.

The extension includes readable local files referenced by Markdown images and links (including reference-style links), and by quoted `src` or `href` attributes in HTML `<img>` and `<a>` elements. It copies each file into `assets/` once and updates the corresponding links in the exported document. Non-local links and unreadable local files keep their original links; the completion message reports their counts. Exporting does not change the open document or contact an external service.

## Install

Once listed in the [official MarkEdit extension registry](https://markedit-app.github.io/extensions/), install **MarkEdit Textpack Export** from MarkEdit's Extension Manager. Until then, the ready-to-use script is [dist/markedit-textpack.js](dist/markedit-textpack.js). To install it manually:

1. In MarkEdit, choose **Open Documents Folder** from the main menu and open its `scripts` folder.
2. Copy `markedit-textpack.js` into `scripts`.
3. Quit and relaunch MarkEdit.

You can also build the script from source with `npm ci && npm run build`. The official registry entry declares MarkEdit 1.36.0 as the minimum supported version.

## Export

Choose **Extensions → Export as Textpack…**, select a destination in the save panel, and save the file. The default name is based on the current document. MarkEdit shows a completion message with the number of bundled local files and any links that could not be bundled. Canceling the save panel leaves no exported file.

The extension provides English and Simplified Chinese text for the menu, success and failure alerts, and partial-export warnings. It uses the editor's browser-language preference; English is the fallback. MarkEdit's native save panel follows the app or system language.

If a local file is omitted, check its path and [grant MarkEdit access to its folder](https://github.com/MarkEdit-app/MarkEdit/wiki/Customization#grant-folder-access), then export again. An unsaved document can be exported, but relative local file paths cannot be resolved until the document has been saved.

## Development

- `npm test` checks ZIP contents, local file handling, link rewriting, and interface messages.
- `npm run build` produces the single-file CommonJS script in `dist/`.

The extension uses the [MarkEdit API](https://github.com/MarkEdit-app/MarkEdit-api) for its menu item, file access, and save panel. Its runtime dependencies, `fflate` and `mdast-util-from-markdown`, are bundled into the distribution script; `markedit-api` is supplied by MarkEdit.

## License

MIT. See [LICENSE](LICENSE). The bundled runtime dependencies are also MIT-licensed.

## 中文说明

将 [dist/markedit-textpack.js](dist/markedit-textpack.js) 复制到 MarkEdit 的 Documents 文件夹内的 `scripts` 目录，重启应用后，从 **Extensions → 导出为 Textpack…** 导出当前文档。扩展会打包可读取的本地图片和附件；无法读取的文件及非本地链接保持原样，导出后会显示提示。界面语言为中文时显示简体中文文案，其余语言默认显示英文。
