#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {};
  argv.slice(2).forEach((arg) => {
    const [key, value] = arg.split('=');
    const normalizedKey = key.replace(/^--/, '');
    args[normalizedKey] = value === undefined ? true : value;
  });
  return args;
}

function safePad(num, width) {
  const str = String(num);
  if (str.length >= width) return str;
  return '0'.repeat(width - str.length) + str;
}

function buildBacklog({
  outputPath,
  title,
  description,
  startNumber,
  totalItems,
  categories,
}) {
  const header = `# ${title}

${description}

---

`;

  const itemsPerCategory = Math.floor(totalItems / categories.length);
  let counter = startNumber;
  let output = header;

  const verbs = [
    'Audit',
    'Refactor',
    'Verify',
    'Ensure',
    'Add',
    'Remove',
    'Improve',
    'Standardize',
    'Consolidate',
    'Document',
  ];

  categories.forEach((category) => {
    const rangeEnd = counter + itemsPerCategory - 1;
    output += `## 🎯 ${category.title} (Items ${counter}-${rangeEnd})\n\n`;

    for (let i = 0; i < itemsPerCategory; i += 1) {
      const itemNumber = counter + i;
      const fileSample = category.exampleFiles[i % category.exampleFiles.length];
      const verb = verbs[i % verbs.length];

      const action = category.template({ verb, fileSample, itemNumber });
      output += `${itemNumber}. ${action}\n`;
    }

    output += '\n';
    counter += itemsPerCategory;
  });

  // Any remaining items (rounding)
  while (counter < startNumber + totalItems) {
    output += `${counter}. Add another improvement item that captures an edge case missed in the primary categories.\n`;
    counter += 1;
  }

  fs.writeFileSync(outputPath, output, 'utf8');
  return outputPath;
}

function main() {
  const args = parseArgs(process.argv);
  const outputPath = args.out;
  const title = args.title;
  const description = args.description;
  const startNumber = Number(args.start) || 1;
  const totalItems = Number(args.count) || 1000;

  if (!outputPath || !title || !description) {
    console.error('Usage: node generate_backlog.js --out=path --title="..." --description="..." --start=4001 --count=1000');
    process.exit(1);
  }

  const categories = JSON.parse(args.categories);

  const resolvedOut = path.isAbsolute(outputPath)
    ? outputPath
    : path.join(process.cwd(), outputPath);

  buildBacklog({ outputPath: resolvedOut, title, description, startNumber, totalItems, categories });
  console.log(`Generated backlog at ${resolvedOut} (items ${startNumber}-${startNumber + totalItems - 1})`);
}

main();
