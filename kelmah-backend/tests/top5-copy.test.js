const fs = require('fs');
const path = require('path');

const copyPath = path.join(__dirname, '..', '..', 'docs', 'ux', 'copy', 'top5-copy.md');

function loadBundle() {
  return fs.readFileSync(copyPath, 'utf8');
}

function parseLocales(markdown) {
  const headerRegex = /^## Locale: ([^\n]+)$/gm;
  const localeHeaders = [];
  let match;

  while ((match = headerRegex.exec(markdown))) {
    localeHeaders.push({
      locale: match[1].trim(),
      start: headerRegex.lastIndex,
      index: match.index,
    });
  }

  return localeHeaders.map((header, index) => {
    const nextHeader = localeHeaders[index + 1];
    const body = markdown.slice(
      header.start,
      nextHeader ? nextHeader.index : markdown.length,
    );

    const sectionMatches = [...body.matchAll(/^### ([^\n]+)$/gm)];
    const sections = sectionMatches.map((sectionMatch, sectionIndex) => {
      const sectionTitle = sectionMatch[1].trim();
      const sectionStart = sectionMatch.index + sectionMatch[0].length;
      const nextSection = sectionMatches[sectionIndex + 1];
      const sectionEnd = nextSection ? nextSection.index : body.length;
      const sectionBody = body.slice(sectionStart, sectionEnd);
      const keyRegex = /^- ([^:]+):/gm;
      const keys = [];
      let keyMatch;

      while ((keyMatch = keyRegex.exec(sectionBody))) {
        keys.push(keyMatch[1].trim());
      }

      return { title: sectionTitle, keys };
    });

    return {
      locale: header.locale,
      sections,
    };
  });
}

describe('Top 5 UX copy localization', () => {
  test('includes the expected locale variants', () => {
    const locales = parseLocales(loadBundle()).map((entry) => entry.locale);

    expect(locales).toEqual(expect.arrayContaining(['en-GH', 'tw']));
    expect(locales).toHaveLength(2);
  });

  test('keeps the same section structure across locales', () => {
    const locales = parseLocales(loadBundle());
    const baseline = locales[0];

    expect(baseline.sections).toHaveLength(5);

    for (const locale of locales.slice(1)) {
      expect(locale.sections.map((section) => section.title)).toEqual(
        baseline.sections.map((section) => section.title),
      );

      expect(locale.sections.map((section) => section.keys)).toEqual(
        baseline.sections.map((section) => section.keys),
      );
    }
  });
});