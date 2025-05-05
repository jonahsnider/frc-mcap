import path from 'node:path';
import { generateCstDts } from 'chevrotain';
import { parser } from './parser.js';

const OUTPUT_PATH = Bun.file(path.join(__dirname, 'generated.d.ts'));

const productions = parser.getGAstProductions();

const dts = generateCstDts(productions);

await OUTPUT_PATH.write(dts);
