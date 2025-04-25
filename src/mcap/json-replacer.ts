// biome-ignore lint/suspicious/noExplicitAny: This is fine
export function jsonBigIntReplacer(key: string, value: any): unknown {
	if (typeof value === 'bigint') {
		// @ts-expect-error This is available
		return JSON.rawJSON(value.toString());
	}

	return value;
}
