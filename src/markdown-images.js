import { fromMarkdown } from 'mdast-util-from-markdown';

function visit(node, callback) {
  callback(node);
  for (const child of node.children ?? []) visit(child, callback);
}

function destinationRange(source, node, definition = false) {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (start === undefined || end === undefined) return undefined;

  let index = start;
  if (definition) {
    while (index < end && source[index] !== ']') {
      if (source[index] === '\\') index++;
      index++;
    }
    if (source[index] !== ']' || source[index + 1] !== ':') return undefined;
    index += 2;
  } else {
    if (source.slice(index, index + 2) === '![') index += 2;
    else if (source[index] === '[') index++;
    else return undefined;
    let depth = 1;
    while (index < end && depth > 0) {
      if (source[index] === '\\') {
        index += 2;
        continue;
      }
      if (source[index] === '[') depth++;
      if (source[index] === ']') depth--;
      index++;
    }
    if (depth !== 0 || source[index] !== '(') return undefined;
    index++;
  }

  while (index < end && /\s/.test(source[index])) index++;
  if (source[index] === '<') {
    const from = ++index;
    while (index < end && source[index] !== '>') {
      if (source[index] === '\\') index++;
      index++;
    }
    return source[index] === '>' ? { from, to: index } : undefined;
  }

  const from = index;
  let depth = 0;
  while (index < end) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === '(') depth++;
    if (source[index] === ')') {
      if (depth === 0) break;
      depth--;
    }
    if (/\s/.test(source[index]) && depth === 0) break;
    index++;
  }
  return index > from ? { from, to: index } : undefined;
}

function htmlAssetRanges(source, node) {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (start === undefined || end === undefined) return [];
  const raw = source.slice(start, end);
  const matches = [];
  const tags = /<(img|a)\b[^>]*>/gi;
  for (const tag of raw.matchAll(tags)) {
    const attributeName = tag[1].toLowerCase() === 'img' ? 'src' : 'href';
    const attribute = new RegExp(`\\b${attributeName}\\s*=\\s*(["'])(.*?)\\1`, 'i').exec(tag[0]);
    if (!attribute) continue;
    const valueOffset = attribute.index + attribute[0].indexOf(attribute[2]);
    matches.push({
      url: attribute[2].replaceAll('&amp;', '&'),
      from: start + tag.index + valueOffset,
      to: start + tag.index + valueOffset + attribute[2].length,
      html: true,
    });
  }
  return matches;
}

export function assetDestinations(source) {
  const tree = fromMarkdown(source);
  const referenced = new Set();
  const destinations = [];

  visit(tree, node => {
    if (node.type === 'imageReference' || node.type === 'linkReference') {
      referenced.add(node.identifier.toLowerCase());
    }
    if (node.type === 'image' || node.type === 'link') {
      const range = destinationRange(source, node);
      if (range) destinations.push({ url: node.url, ...range });
    }
    if (node.type === 'html') destinations.push(...htmlAssetRanges(source, node));
  });

  visit(tree, node => {
    if (node.type !== 'definition' || !referenced.has(node.identifier.toLowerCase())) return;
    const range = destinationRange(source, node, true);
    if (range) destinations.push({ url: node.url, ...range });
  });

  return destinations.sort((a, b) => a.from - b.from);
}

export function replaceDestinations(source, replacements) {
  let result = source;
  for (const { from, to, value } of [...replacements].sort((a, b) => b.from - a.from)) {
    result = result.slice(0, from) + value + result.slice(to);
  }
  return result;
}
