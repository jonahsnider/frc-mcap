import type { StructPayload } from './types';

export function structPayloadToJson(payload: StructPayload): object {
	const result: Record<string, unknown> = {};

	for (const [key, value] of payload) {
		if (value instanceof Map) {
			result[key] = structPayloadToJson(value);
		} else {
			result[key] = value;
		}
	}

	return result;
}
