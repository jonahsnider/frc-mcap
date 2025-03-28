export type WpilogHeader = {
	version: {
		major: number;
		minor: number;
	};
	extraHeader: string;
};

export enum WpilogRecordType {
	Raw = 'raw',
	Boolean = 'boolean',
	Int64 = 'int64',
	Float = 'float',
	Double = 'double',
	String = 'string',
	BooleanArray = 'boolean[]',
	Int64Array = 'int64[]',
	FloatArray = 'float[]',
	DoubleArray = 'double[]',
	StringArray = 'string[]',
	ControlRecord = 0,
}

export type WpilogRecord = {
	entryId: number;
	timestamp: bigint;
} & (
	| {
			type: WpilogRecordType.ControlRecord;
			payload: WpilogControlRecordPayload;
	  }
	| ({
			name: string;
	  } & (
			| {
					type: WpilogRecordType.Raw;
					payload: Uint8Array;
			  }
			| {
					type: WpilogRecordType.Boolean;
					payload: boolean;
			  }
			| {
					type: WpilogRecordType.Int64;
					payload: bigint;
			  }
			| {
					type: WpilogRecordType.Float;
					payload: number;
			  }
			| {
					type: WpilogRecordType.Double;
					payload: number;
			  }
			| {
					type: WpilogRecordType.String;
					payload: string;
			  }
			| {
					type: WpilogRecordType.BooleanArray;
					payload: boolean[];
			  }
			| { type: WpilogRecordType.Int64Array; payload: bigint[] }
			| { type: WpilogRecordType.FloatArray; payload: number[] }
			| { type: WpilogRecordType.DoubleArray; payload: number[] }
			| { type: WpilogRecordType.StringArray; payload: string[] }
	  ))
);

export enum WpilogControlRecordType {
	Start = 0,
	Finish = 1,
	SetMetadata = 2,
}

export type WpilogStartControlRecord = {
	type: WpilogControlRecordType.Start;
	entryId: number;
	entryName: string;
	entryType: string;
	entryMetadata: string;
};

export type WpilogFinishControlRecord = {
	type: WpilogControlRecordType.Finish;
	entryId: number;
};

export type WpilogSetMetadataControlRecord = {
	type: WpilogControlRecordType.SetMetadata;
	entryId: number;
	entryMetadata: string;
};

export type WpilogControlRecordPayload =
	| WpilogStartControlRecord
	| WpilogFinishControlRecord
	| WpilogSetMetadataControlRecord;
