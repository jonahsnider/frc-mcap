import path from 'node:path';

export function changeExtension(filePath: string, oldExtension: string, newExtension: string): string {
	return path.join(path.dirname(filePath), path.basename(filePath, oldExtension) + newExtension);
}
