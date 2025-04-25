/**
 * The Channel `message_encoding` field describes the encoding for all messages within a channel. This field is mandatory.
 * @see https://mcap.dev/spec/registry#message-encodings
 */
export enum McapMessageEncoding {
	Ros1 = 'ros1',
	Cdr = 'cdr',
	Protobuf = 'protobuf',
	Cbor = 'cbor',
	Msgpack = 'msgpack',
	Json = 'json',
}

export enum McapSchemaEncoding {
	SelfDescribing = '',
	Protobuf = 'protobuf',
	FlatBuffer = 'flatbuffer',
	Ros1Msg = 'ros1msg',
	Ros2Msg = 'ros2msg',
	Ros2Idl = 'ros2idl',
	OmgIdl = 'omgidl',
	JsonSchema = 'jsonschema',
}
