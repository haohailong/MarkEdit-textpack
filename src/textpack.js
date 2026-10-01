import { strToU8, zipSync } from 'fflate';
import { assetDestinations, replaceDestinations } from './markdown-images.js';

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function toBase64(bytes) {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function normalizePath(path) {
  const parts = [];
  for (const part of path.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return '/' + parts.join('/');
}

function localPath(url, documentInfo, homePath) {
  if (!url || url.startsWith('#') || url.startsWith('//')) return undefined;
  if (/^[a-z][a-z\d+.-]*:/i.test(url) && !/^file:/i.test(url)) return undefined;

  let path;
  try {
    if (/^file:/i.test(url)) {
      const fileURL = new URL(url);
      if (fileURL.host && fileURL.host !== 'localhost') return undefined;
      path = fileURL.pathname;
    } else {
      path = url.split(/[?#]/, 1)[0];
    }
    path = decodeURIComponent(path);
  } catch {
    return undefined;
  }
  if (path.startsWith('~/')) return normalizePath(homePath + path.slice(1));
  if (path.startsWith('/')) return normalizePath(path);
  if (!documentInfo?.parentPath) return null;
  return normalizePath(documentInfo.parentPath + '/' + path);
}

function safeFilename(path, extension) {
  let name = path.split('/').pop() || 'image';
  name = name.replace(/[\u0000-\u001f\u007f<>:"\\|?*]/g, '_');
  if (!name.includes('.') && extension) name += '.' + extension.replace(/^\./, '');
  return name || 'image';
}

function uniqueName(name, used) {
  if (!used.has(name.toLowerCase())) {
    used.add(name.toLowerCase());
    return name;
  }
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const suffix = dot > 0 ? name.slice(dot) : '';
  let counter = 2;
  while (used.has(`${stem}-${counter}${suffix}`.toLowerCase())) counter++;
  const next = `${stem}-${counter}${suffix}`;
  used.add(next.toLowerCase());
  return next;
}

function outputFilename(documentInfo) {
  const sourceName = documentInfo?.filePath?.split('/').pop() || 'Untitled';
  const stem = sourceName.replace(/\.(?:md|markdown|mdown|txt)$/i, '') || 'Untitled';
  return `${stem.replace(/[\u0000-\u001f\u007f/:]/g, '_')}.textpack`;
}

/** Build a TextBundle v2 ZIP without changing the open document. */
export async function createTextpack(markdown, documentInfo, { getFileObject, homePath = '' }) {
  const entries = {
    'info.json': strToU8(JSON.stringify({
      version: 2,
      type: 'net.daringfireball.markdown',
      transient: false,
      creatorIdentifier: 'app.cyan.markedit',
    }, null, 2) + '\n'),
    'assets/': new Uint8Array(),
  };
  const replacements = [];
  const cached = new Map();
  const usedNames = new Set();
  const missing = [];
  let remoteCount = 0;

  for (const destination of assetDestinations(markdown)) {
    const path = localPath(destination.url, documentInfo, homePath);
    if (path === undefined) {
      remoteCount++;
      continue;
    }
    if (path === null) {
      missing.push(destination.url);
      continue;
    }
    if (!cached.has(path)) {
      let file;
      try {
        file = await getFileObject(path);
      } catch {
        // A missing sandbox permission should not prevent exporting the text.
      }
      if (!file?.data) {
        cached.set(path, null);
        missing.push(destination.url);
      } else {
        const name = uniqueName(safeFilename(path, file.filenameExtension), usedNames);
        const archivePath = `assets/${name}`;
        entries[archivePath] = decodeBase64(file.data);
        cached.set(path, archivePath);
      }
    }
    const archivePath = cached.get(path);
    if (archivePath) {
      const encoded = `assets/${encodeURIComponent(archivePath.slice('assets/'.length))}`;
      replacements.push({ ...destination, value: destination.html ? encoded.replaceAll('&', '&amp;') : encoded });
    }
  }

  entries['text.md'] = strToU8(replaceDestinations(markdown, replacements));
  return {
    archive: zipSync(entries, { level: 6 }),
    fileName: outputFilename(documentInfo),
    assetCount: cached.size - [...cached.values()].filter(value => value === null).length,
    missing,
    remoteCount,
  };
}
