import path from 'node:path';

const OUTPUT_FILE = Bun.file(path.join(__dirname, '..', '..', 'dist', 'chevrotain-playground.js'));

const CHEVROTAIN_IMPORT_REGEXP = /^import (.+) from "chevrotain";$/gm;

const contents = await OUTPUT_FILE.text();

const transformed = `(() => {${contents.replaceAll(CHEVROTAIN_IMPORT_REGEXP, (_, importName) => {
	return `const ${importName} = chevrotain;`;
})}})();`;

await OUTPUT_FILE.write(transformed);

console.log(OUTPUT_FILE.name);
