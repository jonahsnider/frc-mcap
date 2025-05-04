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
	StructSchema = 'structschema',
	BooleanArray = 'boolean[]',
	Int64Array = 'int64[]',
	FloatArray = 'float[]',
	DoubleArray = 'double[]',
	StringArray = 'string[]',
	ControlRecord = 0,
	Struct = 1,
	StructArray = 2,
}

export type StructPayload = Map<
	string,
	number | boolean | bigint | string | StructPayload | number[] | boolean[] | bigint[] | StructPayload[]
>;

export type StructPayloadValue = StructPayload extends Map<unknown, infer ValueType> ? ValueType : never;

export type WpilogRecord = {
	entryId: number;
	/** Timestamp in microseconds since FPGA boot. */
	timestamp: bigint;
} & (
	| {
			type: WpilogRecordType.ControlRecord;
			payload: WpilogControlRecordPayload;
	  }
	| ({
			name: string;
			metadata: string;
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
			| { type: WpilogRecordType.Struct; structName: string; payload: StructPayload }
			| { type: WpilogRecordType.StructArray; structName: string; payload: StructPayload[] }
	  ))
);

export enum WpilogControlRecordType {
	Start = 0,
	Finish = 1,
	SetMetadata = 2,
}

export type WpilogStartControlRecord = {
	controlRecordType: WpilogControlRecordType.Start;
	entryId: number;
	entryName: string;
	entryType: string;
	entryMetadata: string;
};

export type WpilogFinishControlRecord = {
	controlRecordType: WpilogControlRecordType.Finish;
	entryId: number;
};

export type WpilogSetMetadataControlRecord = {
	controlRecordType: WpilogControlRecordType.SetMetadata;
	entryId: number;
	entryMetadata: string;
};

export type WpilogControlRecordPayload =
	| WpilogStartControlRecord
	| WpilogFinishControlRecord
	| WpilogSetMetadataControlRecord;
