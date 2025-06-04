const jsdom = require('jsdom');

function searchLinks(text) {
  const result = [];
  const find = [...text.matchAll(/http[s]?:\/\/[\w.\-\/%А-я?=&#]+/g)];
  let start = 0;
  for (let i = 0; i < find.length; i++) {
    const end = find[i].index - 1 < 0 ? 0 : find[i].index - 1;
    const piece = text.slice(start, end).trim();
    if (piece) {
      result.push({ type: 'text', text: piece });
    }
    start = find[i].index + find[i][0].length;
    result.push({ type: 'link', text: find[i][0] });
  }
  const piece = text.slice(start).trim();
  if (piece) {
    result.push({ type: 'text', text: piece });
  }
  return result;
}  

async function getMetaTagContent(url) {
  const response = await fetch(url);
  if (response.ok) {
    try {
      const html = await response.text();
      const dom = new jsdom.JSDOM(html);
      const doc = dom.window.document;
      const result = { flagHealth: true, url };
      const title = doc.querySelector('title');
      if (title) {
        result.title = title.textContent;
      }
      const metaTagDescription = doc.querySelector(`meta[name="description"]`);
      if (metaTagDescription) {
        result.description = metaTagDescription.getAttribute('content');
      }
      const metaTagImage = doc.querySelector(`meta[itemprop="image"]`);
      if (metaTagImage) {
        result.image = metaTagImage.getAttribute('content');
      }
      return result;
    } catch {
      throw new Error('Error processing response!');
    }
  } else {
    throw new Error('Error HTTP: ' + response.status);
  }
}

class Division {
  static async creatingTextLink(messageRequestText) {
    const textLinkList = searchLinks(messageRequestText);
    const objList = [];
    for (const textLink of textLinkList) {
      const objTextLink = { type: textLink.type }
      if (textLink.type === 'link') {
        try {
          const result = await getMetaTagContent(textLink.text);
          objTextLink.data = result;
        } catch (error) {
          objTextLink.data = {
            flagHealth: false,
            url: textLink.text,
          };
        }
      } else {
        objTextLink.data = { text: textLink.text }
      }
      objList.push(objTextLink);
    }
    return objList;
  }
}

module.exports = {
  Division,
}
