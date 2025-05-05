import { describe, expect, mock, test } from 'bun:test';
import { StructDecodeQueue } from './struct-decode-queue.js';
import { type WpilogRecord, WpilogRecordType } from './types.js';

describe('struct decode queue', () => {
	test('waits for struct definition before processing queued records', () => {
		const callback = mock();
		const queue = new StructDecodeQueue(callback);

		// Simulate a record for Pose2d before its schema is defined
		const pose2dRecord: WpilogRecord = {
			entryId: 0,
			timestamp: 0n,
			type: WpilogRecordType.Raw,
			payload: new Uint8Array(8 * 3),
			name: '/MyPose',
			metadata: '',
		};
		queue.queueStructRecord('Pose2d', pose2dRecord);
		expect(callback).toBeCalledTimes(0);

		// Register Pose2d schema, but it depends on Translation2d and Rotation2d
		queue.registerSchema('Pose2d', ['Translation2d', 'Rotation2d']);
		expect(callback).toBeCalledTimes(0);

		// Register Translation2d schema, which has no dependencies
		queue.registerSchema('Translation2d', []);
		expect(callback).toBeCalledTimes(0);

		// Register Rotation2d schema, which has no dependencies
		queue.registerSchema('Rotation2d', []);
		// Now all dependencies are satisfied, callback should be called
		expect(callback).toBeCalledTimes(1);
		// Should be called with 'Pose2d' and the queued record
		expect(callback).toBeCalledWith('Pose2d', [pose2dRecord]);
	});
});
