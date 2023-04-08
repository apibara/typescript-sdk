/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.apibara = (function() {

    /**
     * Namespace apibara.
     * @exports apibara
     * @namespace
     */
    var apibara = {};

    apibara.ethereum = (function() {

        /**
         * Namespace ethereum.
         * @memberof apibara
         * @namespace
         */
        var ethereum = {};

        ethereum.v1alpha2 = (function() {

            /**
             * Namespace v1alpha2.
             * @memberof apibara.ethereum
             * @namespace
             */
            var v1alpha2 = {};

            v1alpha2.Block = (function() {

                /**
                 * Properties of a Block.
                 * @memberof apibara.ethereum.v1alpha2
                 * @interface IBlock
                 * @property {apibara.ethereum.v1alpha2.BlockStatus|null} [status] Block status
                 * @property {apibara.ethereum.v1alpha2.IBlockHeader|null} [header] Block header
                 * @property {Array.<apibara.ethereum.v1alpha2.ILogWithTransaction>|null} [logs] Block logs
                 */

                /**
                 * Constructs a new Block.
                 * @memberof apibara.ethereum.v1alpha2
                 * @classdesc Represents a Block.
                 * @implements IBlock
                 * @constructor
                 * @param {apibara.ethereum.v1alpha2.IBlock=} [properties] Properties to set
                 */
                function Block(properties) {
                    this.logs = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Block status.
                 * @member {apibara.ethereum.v1alpha2.BlockStatus} status
                 * @memberof apibara.ethereum.v1alpha2.Block
                 * @instance
                 */
                Block.prototype.status = 0;

                /**
                 * Block header.
                 * @member {apibara.ethereum.v1alpha2.IBlockHeader|null|undefined} header
                 * @memberof apibara.ethereum.v1alpha2.Block
                 * @instance
                 */
                Block.prototype.header = null;

                /**
                 * Block logs.
                 * @member {Array.<apibara.ethereum.v1alpha2.ILogWithTransaction>} logs
                 * @memberof apibara.ethereum.v1alpha2.Block
                 * @instance
                 */
                Block.prototype.logs = $util.emptyArray;

                /**
                 * Creates a new Block instance using the specified properties.
                 * @function create
                 * @memberof apibara.ethereum.v1alpha2.Block
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IBlock=} [properties] Properties to set
                 * @returns {apibara.ethereum.v1alpha2.Block} Block instance
                 */
                Block.create = function create(properties) {
                    return new Block(properties);
                };

                /**
                 * Encodes the specified Block message. Does not implicitly {@link apibara.ethereum.v1alpha2.Block.verify|verify} messages.
                 * @function encode
                 * @memberof apibara.ethereum.v1alpha2.Block
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IBlock} message Block message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Block.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.status != null && Object.hasOwnProperty.call(message, "status"))
                        writer.uint32(/* id 1, wireType 0 =*/8).int32(message.status);
                    if (message.header != null && Object.hasOwnProperty.call(message, "header"))
                        $root.apibara.ethereum.v1alpha2.BlockHeader.encode(message.header, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                    if (message.logs != null && message.logs.length)
                        for (var i = 0; i < message.logs.length; ++i)
                            $root.apibara.ethereum.v1alpha2.LogWithTransaction.encode(message.logs[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                    return writer;
                };

                /**
                 * Encodes the specified Block message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.Block.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.Block
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IBlock} message Block message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Block.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a Block message from the specified reader or buffer.
                 * @function decode
                 * @memberof apibara.ethereum.v1alpha2.Block
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {apibara.ethereum.v1alpha2.Block} Block
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Block.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.apibara.ethereum.v1alpha2.Block();
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1: {
                                message.status = reader.int32();
                                break;
                            }
                        case 2: {
                                message.header = $root.apibara.ethereum.v1alpha2.BlockHeader.decode(reader, reader.uint32());
                                break;
                            }
                        case 3: {
                                if (!(message.logs && message.logs.length))
                                    message.logs = [];
                                message.logs.push($root.apibara.ethereum.v1alpha2.LogWithTransaction.decode(reader, reader.uint32()));
                                break;
                            }
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a Block message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.Block
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {apibara.ethereum.v1alpha2.Block} Block
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Block.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a Block message.
                 * @function verify
                 * @memberof apibara.ethereum.v1alpha2.Block
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                Block.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.status != null && message.hasOwnProperty("status"))
                        switch (message.status) {
                        default:
                            return "status: enum value expected";
                        case 0:
                        case 1:
                        case 2:
                        case 3:
                        case 4:
                        case 5:
                            break;
                        }
                    if (message.header != null && message.hasOwnProperty("header")) {
                        var error = $root.apibara.ethereum.v1alpha2.BlockHeader.verify(message.header);
                        if (error)
                            return "header." + error;
                    }
                    if (message.logs != null && message.hasOwnProperty("logs")) {
                        if (!Array.isArray(message.logs))
                            return "logs: array expected";
                        for (var i = 0; i < message.logs.length; ++i) {
                            var error = $root.apibara.ethereum.v1alpha2.LogWithTransaction.verify(message.logs[i]);
                            if (error)
                                return "logs." + error;
                        }
                    }
                    return null;
                };

                /**
                 * Creates a Block message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof apibara.ethereum.v1alpha2.Block
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {apibara.ethereum.v1alpha2.Block} Block
                 */
                Block.fromObject = function fromObject(object) {
                    if (object instanceof $root.apibara.ethereum.v1alpha2.Block)
                        return object;
                    var message = new $root.apibara.ethereum.v1alpha2.Block();
                    switch (object.status) {
                    default:
                        if (typeof object.status === "number") {
                            message.status = object.status;
                            break;
                        }
                        break;
                    case "BLOCK_STATUS_UNSPECIFIED":
                    case 0:
                        message.status = 0;
                        break;
                    case "BLOCK_STATUS_PENDING":
                    case 1:
                        message.status = 1;
                        break;
                    case "BLOCK_STATUS_ACCEPTED":
                    case 2:
                        message.status = 2;
                        break;
                    case "BLOCK_STATUS_SAFE":
                    case 3:
                        message.status = 3;
                        break;
                    case "BLOCK_STATUS_FINALIZED":
                    case 4:
                        message.status = 4;
                        break;
                    case "BLOCK_STATUS_REJECTED":
                    case 5:
                        message.status = 5;
                        break;
                    }
                    if (object.header != null) {
                        if (typeof object.header !== "object")
                            throw TypeError(".apibara.ethereum.v1alpha2.Block.header: object expected");
                        message.header = $root.apibara.ethereum.v1alpha2.BlockHeader.fromObject(object.header);
                    }
                    if (object.logs) {
                        if (!Array.isArray(object.logs))
                            throw TypeError(".apibara.ethereum.v1alpha2.Block.logs: array expected");
                        message.logs = [];
                        for (var i = 0; i < object.logs.length; ++i) {
                            if (typeof object.logs[i] !== "object")
                                throw TypeError(".apibara.ethereum.v1alpha2.Block.logs: object expected");
                            message.logs[i] = $root.apibara.ethereum.v1alpha2.LogWithTransaction.fromObject(object.logs[i]);
                        }
                    }
                    return message;
                };

                /**
                 * Creates a plain object from a Block message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof apibara.ethereum.v1alpha2.Block
                 * @static
                 * @param {apibara.ethereum.v1alpha2.Block} message Block
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Block.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.logs = [];
                    if (options.defaults) {
                        object.status = options.enums === String ? "BLOCK_STATUS_UNSPECIFIED" : 0;
                        object.header = null;
                    }
                    if (message.status != null && message.hasOwnProperty("status"))
                        object.status = options.enums === String ? $root.apibara.ethereum.v1alpha2.BlockStatus[message.status] === undefined ? message.status : $root.apibara.ethereum.v1alpha2.BlockStatus[message.status] : message.status;
                    if (message.header != null && message.hasOwnProperty("header"))
                        object.header = $root.apibara.ethereum.v1alpha2.BlockHeader.toObject(message.header, options);
                    if (message.logs && message.logs.length) {
                        object.logs = [];
                        for (var j = 0; j < message.logs.length; ++j)
                            object.logs[j] = $root.apibara.ethereum.v1alpha2.LogWithTransaction.toObject(message.logs[j], options);
                    }
                    return object;
                };

                /**
                 * Converts this Block to JSON.
                 * @function toJSON
                 * @memberof apibara.ethereum.v1alpha2.Block
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Block.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for Block
                 * @function getTypeUrl
                 * @memberof apibara.ethereum.v1alpha2.Block
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Block.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/apibara.ethereum.v1alpha2.Block";
                };

                return Block;
            })();

            v1alpha2.BlockHeader = (function() {

                /**
                 * Properties of a BlockHeader.
                 * @memberof apibara.ethereum.v1alpha2
                 * @interface IBlockHeader
                 * @property {apibara.ethereum.v1alpha2.IH256|null} [blockHash] BlockHeader blockHash
                 * @property {apibara.ethereum.v1alpha2.IH256|null} [parentBlockHash] BlockHeader parentBlockHash
                 * @property {apibara.ethereum.v1alpha2.IH256|null} [ommersHash] BlockHeader ommersHash
                 * @property {apibara.ethereum.v1alpha2.IH160|null} [beneficiary] BlockHeader beneficiary
                 * @property {apibara.ethereum.v1alpha2.IH256|null} [stateRoot] BlockHeader stateRoot
                 * @property {apibara.ethereum.v1alpha2.IH256|null} [transactionsRoot] BlockHeader transactionsRoot
                 * @property {apibara.ethereum.v1alpha2.IH256|null} [receiptsRoot] BlockHeader receiptsRoot
                 * @property {apibara.ethereum.v1alpha2.IH256|null} [withdrawalsRoot] BlockHeader withdrawalsRoot
                 * @property {Uint8Array|null} [logsBloom] BlockHeader logsBloom
                 * @property {number|Long|null} [difficulty] BlockHeader difficulty
                 * @property {number|Long|null} [blockNumber] BlockHeader blockNumber
                 * @property {number|Long|null} [gasLimit] BlockHeader gasLimit
                 * @property {number|Long|null} [gasUsed] BlockHeader gasUsed
                 * @property {google.protobuf.ITimestamp|null} [timestamp] BlockHeader timestamp
                 * @property {apibara.ethereum.v1alpha2.IH256|null} [mixHash] BlockHeader mixHash
                 * @property {number|Long|null} [nonce] BlockHeader nonce
                 * @property {number|Long|null} [baseFeePerGas] BlockHeader baseFeePerGas
                 * @property {Uint8Array|null} [extraData] BlockHeader extraData
                 */

                /**
                 * Constructs a new BlockHeader.
                 * @memberof apibara.ethereum.v1alpha2
                 * @classdesc Represents a BlockHeader.
                 * @implements IBlockHeader
                 * @constructor
                 * @param {apibara.ethereum.v1alpha2.IBlockHeader=} [properties] Properties to set
                 */
                function BlockHeader(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * BlockHeader blockHash.
                 * @member {apibara.ethereum.v1alpha2.IH256|null|undefined} blockHash
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.blockHash = null;

                /**
                 * BlockHeader parentBlockHash.
                 * @member {apibara.ethereum.v1alpha2.IH256|null|undefined} parentBlockHash
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.parentBlockHash = null;

                /**
                 * BlockHeader ommersHash.
                 * @member {apibara.ethereum.v1alpha2.IH256|null|undefined} ommersHash
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.ommersHash = null;

                /**
                 * BlockHeader beneficiary.
                 * @member {apibara.ethereum.v1alpha2.IH160|null|undefined} beneficiary
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.beneficiary = null;

                /**
                 * BlockHeader stateRoot.
                 * @member {apibara.ethereum.v1alpha2.IH256|null|undefined} stateRoot
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.stateRoot = null;

                /**
                 * BlockHeader transactionsRoot.
                 * @member {apibara.ethereum.v1alpha2.IH256|null|undefined} transactionsRoot
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.transactionsRoot = null;

                /**
                 * BlockHeader receiptsRoot.
                 * @member {apibara.ethereum.v1alpha2.IH256|null|undefined} receiptsRoot
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.receiptsRoot = null;

                /**
                 * BlockHeader withdrawalsRoot.
                 * @member {apibara.ethereum.v1alpha2.IH256|null|undefined} withdrawalsRoot
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.withdrawalsRoot = null;

                /**
                 * BlockHeader logsBloom.
                 * @member {Uint8Array} logsBloom
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.logsBloom = $util.newBuffer([]);

                /**
                 * BlockHeader difficulty.
                 * @member {number|Long} difficulty
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.difficulty = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

                /**
                 * BlockHeader blockNumber.
                 * @member {number|Long} blockNumber
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.blockNumber = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

                /**
                 * BlockHeader gasLimit.
                 * @member {number|Long} gasLimit
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.gasLimit = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

                /**
                 * BlockHeader gasUsed.
                 * @member {number|Long} gasUsed
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.gasUsed = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

                /**
                 * BlockHeader timestamp.
                 * @member {google.protobuf.ITimestamp|null|undefined} timestamp
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.timestamp = null;

                /**
                 * BlockHeader mixHash.
                 * @member {apibara.ethereum.v1alpha2.IH256|null|undefined} mixHash
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.mixHash = null;

                /**
                 * BlockHeader nonce.
                 * @member {number|Long} nonce
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.nonce = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

                /**
                 * BlockHeader baseFeePerGas.
                 * @member {number|Long} baseFeePerGas
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.baseFeePerGas = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

                /**
                 * BlockHeader extraData.
                 * @member {Uint8Array} extraData
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.extraData = $util.newBuffer([]);

                /**
                 * Creates a new BlockHeader instance using the specified properties.
                 * @function create
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IBlockHeader=} [properties] Properties to set
                 * @returns {apibara.ethereum.v1alpha2.BlockHeader} BlockHeader instance
                 */
                BlockHeader.create = function create(properties) {
                    return new BlockHeader(properties);
                };

                /**
                 * Encodes the specified BlockHeader message. Does not implicitly {@link apibara.ethereum.v1alpha2.BlockHeader.verify|verify} messages.
                 * @function encode
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IBlockHeader} message BlockHeader message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                BlockHeader.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.blockHash != null && Object.hasOwnProperty.call(message, "blockHash"))
                        $root.apibara.ethereum.v1alpha2.H256.encode(message.blockHash, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                    if (message.parentBlockHash != null && Object.hasOwnProperty.call(message, "parentBlockHash"))
                        $root.apibara.ethereum.v1alpha2.H256.encode(message.parentBlockHash, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                    if (message.ommersHash != null && Object.hasOwnProperty.call(message, "ommersHash"))
                        $root.apibara.ethereum.v1alpha2.H256.encode(message.ommersHash, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                    if (message.beneficiary != null && Object.hasOwnProperty.call(message, "beneficiary"))
                        $root.apibara.ethereum.v1alpha2.H160.encode(message.beneficiary, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                    if (message.stateRoot != null && Object.hasOwnProperty.call(message, "stateRoot"))
                        $root.apibara.ethereum.v1alpha2.H256.encode(message.stateRoot, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
                    if (message.transactionsRoot != null && Object.hasOwnProperty.call(message, "transactionsRoot"))
                        $root.apibara.ethereum.v1alpha2.H256.encode(message.transactionsRoot, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
                    if (message.receiptsRoot != null && Object.hasOwnProperty.call(message, "receiptsRoot"))
                        $root.apibara.ethereum.v1alpha2.H256.encode(message.receiptsRoot, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
                    if (message.withdrawalsRoot != null && Object.hasOwnProperty.call(message, "withdrawalsRoot"))
                        $root.apibara.ethereum.v1alpha2.H256.encode(message.withdrawalsRoot, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
                    if (message.logsBloom != null && Object.hasOwnProperty.call(message, "logsBloom"))
                        writer.uint32(/* id 9, wireType 2 =*/74).bytes(message.logsBloom);
                    if (message.difficulty != null && Object.hasOwnProperty.call(message, "difficulty"))
                        writer.uint32(/* id 10, wireType 0 =*/80).uint64(message.difficulty);
                    if (message.blockNumber != null && Object.hasOwnProperty.call(message, "blockNumber"))
                        writer.uint32(/* id 11, wireType 0 =*/88).uint64(message.blockNumber);
                    if (message.gasLimit != null && Object.hasOwnProperty.call(message, "gasLimit"))
                        writer.uint32(/* id 12, wireType 0 =*/96).uint64(message.gasLimit);
                    if (message.gasUsed != null && Object.hasOwnProperty.call(message, "gasUsed"))
                        writer.uint32(/* id 13, wireType 0 =*/104).uint64(message.gasUsed);
                    if (message.timestamp != null && Object.hasOwnProperty.call(message, "timestamp"))
                        $root.google.protobuf.Timestamp.encode(message.timestamp, writer.uint32(/* id 14, wireType 2 =*/114).fork()).ldelim();
                    if (message.mixHash != null && Object.hasOwnProperty.call(message, "mixHash"))
                        $root.apibara.ethereum.v1alpha2.H256.encode(message.mixHash, writer.uint32(/* id 15, wireType 2 =*/122).fork()).ldelim();
                    if (message.nonce != null && Object.hasOwnProperty.call(message, "nonce"))
                        writer.uint32(/* id 16, wireType 0 =*/128).uint64(message.nonce);
                    if (message.baseFeePerGas != null && Object.hasOwnProperty.call(message, "baseFeePerGas"))
                        writer.uint32(/* id 17, wireType 0 =*/136).uint64(message.baseFeePerGas);
                    if (message.extraData != null && Object.hasOwnProperty.call(message, "extraData"))
                        writer.uint32(/* id 18, wireType 2 =*/146).bytes(message.extraData);
                    return writer;
                };

                /**
                 * Encodes the specified BlockHeader message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.BlockHeader.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IBlockHeader} message BlockHeader message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                BlockHeader.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a BlockHeader message from the specified reader or buffer.
                 * @function decode
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {apibara.ethereum.v1alpha2.BlockHeader} BlockHeader
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                BlockHeader.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.apibara.ethereum.v1alpha2.BlockHeader();
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1: {
                                message.blockHash = $root.apibara.ethereum.v1alpha2.H256.decode(reader, reader.uint32());
                                break;
                            }
                        case 2: {
                                message.parentBlockHash = $root.apibara.ethereum.v1alpha2.H256.decode(reader, reader.uint32());
                                break;
                            }
                        case 3: {
                                message.ommersHash = $root.apibara.ethereum.v1alpha2.H256.decode(reader, reader.uint32());
                                break;
                            }
                        case 4: {
                                message.beneficiary = $root.apibara.ethereum.v1alpha2.H160.decode(reader, reader.uint32());
                                break;
                            }
                        case 5: {
                                message.stateRoot = $root.apibara.ethereum.v1alpha2.H256.decode(reader, reader.uint32());
                                break;
                            }
                        case 6: {
                                message.transactionsRoot = $root.apibara.ethereum.v1alpha2.H256.decode(reader, reader.uint32());
                                break;
                            }
                        case 7: {
                                message.receiptsRoot = $root.apibara.ethereum.v1alpha2.H256.decode(reader, reader.uint32());
                                break;
                            }
                        case 8: {
                                message.withdrawalsRoot = $root.apibara.ethereum.v1alpha2.H256.decode(reader, reader.uint32());
                                break;
                            }
                        case 9: {
                                message.logsBloom = reader.bytes();
                                break;
                            }
                        case 10: {
                                message.difficulty = reader.uint64();
                                break;
                            }
                        case 11: {
                                message.blockNumber = reader.uint64();
                                break;
                            }
                        case 12: {
                                message.gasLimit = reader.uint64();
                                break;
                            }
                        case 13: {
                                message.gasUsed = reader.uint64();
                                break;
                            }
                        case 14: {
                                message.timestamp = $root.google.protobuf.Timestamp.decode(reader, reader.uint32());
                                break;
                            }
                        case 15: {
                                message.mixHash = $root.apibara.ethereum.v1alpha2.H256.decode(reader, reader.uint32());
                                break;
                            }
                        case 16: {
                                message.nonce = reader.uint64();
                                break;
                            }
                        case 17: {
                                message.baseFeePerGas = reader.uint64();
                                break;
                            }
                        case 18: {
                                message.extraData = reader.bytes();
                                break;
                            }
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a BlockHeader message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {apibara.ethereum.v1alpha2.BlockHeader} BlockHeader
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                BlockHeader.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a BlockHeader message.
                 * @function verify
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                BlockHeader.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.blockHash != null && message.hasOwnProperty("blockHash")) {
                        var error = $root.apibara.ethereum.v1alpha2.H256.verify(message.blockHash);
                        if (error)
                            return "blockHash." + error;
                    }
                    if (message.parentBlockHash != null && message.hasOwnProperty("parentBlockHash")) {
                        var error = $root.apibara.ethereum.v1alpha2.H256.verify(message.parentBlockHash);
                        if (error)
                            return "parentBlockHash." + error;
                    }
                    if (message.ommersHash != null && message.hasOwnProperty("ommersHash")) {
                        var error = $root.apibara.ethereum.v1alpha2.H256.verify(message.ommersHash);
                        if (error)
                            return "ommersHash." + error;
                    }
                    if (message.beneficiary != null && message.hasOwnProperty("beneficiary")) {
                        var error = $root.apibara.ethereum.v1alpha2.H160.verify(message.beneficiary);
                        if (error)
                            return "beneficiary." + error;
                    }
                    if (message.stateRoot != null && message.hasOwnProperty("stateRoot")) {
                        var error = $root.apibara.ethereum.v1alpha2.H256.verify(message.stateRoot);
                        if (error)
                            return "stateRoot." + error;
                    }
                    if (message.transactionsRoot != null && message.hasOwnProperty("transactionsRoot")) {
                        var error = $root.apibara.ethereum.v1alpha2.H256.verify(message.transactionsRoot);
                        if (error)
                            return "transactionsRoot." + error;
                    }
                    if (message.receiptsRoot != null && message.hasOwnProperty("receiptsRoot")) {
                        var error = $root.apibara.ethereum.v1alpha2.H256.verify(message.receiptsRoot);
                        if (error)
                            return "receiptsRoot." + error;
                    }
                    if (message.withdrawalsRoot != null && message.hasOwnProperty("withdrawalsRoot")) {
                        var error = $root.apibara.ethereum.v1alpha2.H256.verify(message.withdrawalsRoot);
                        if (error)
                            return "withdrawalsRoot." + error;
                    }
                    if (message.logsBloom != null && message.hasOwnProperty("logsBloom"))
                        if (!(message.logsBloom && typeof message.logsBloom.length === "number" || $util.isString(message.logsBloom)))
                            return "logsBloom: buffer expected";
                    if (message.difficulty != null && message.hasOwnProperty("difficulty"))
                        if (!$util.isInteger(message.difficulty) && !(message.difficulty && $util.isInteger(message.difficulty.low) && $util.isInteger(message.difficulty.high)))
                            return "difficulty: integer|Long expected";
                    if (message.blockNumber != null && message.hasOwnProperty("blockNumber"))
                        if (!$util.isInteger(message.blockNumber) && !(message.blockNumber && $util.isInteger(message.blockNumber.low) && $util.isInteger(message.blockNumber.high)))
                            return "blockNumber: integer|Long expected";
                    if (message.gasLimit != null && message.hasOwnProperty("gasLimit"))
                        if (!$util.isInteger(message.gasLimit) && !(message.gasLimit && $util.isInteger(message.gasLimit.low) && $util.isInteger(message.gasLimit.high)))
                            return "gasLimit: integer|Long expected";
                    if (message.gasUsed != null && message.hasOwnProperty("gasUsed"))
                        if (!$util.isInteger(message.gasUsed) && !(message.gasUsed && $util.isInteger(message.gasUsed.low) && $util.isInteger(message.gasUsed.high)))
                            return "gasUsed: integer|Long expected";
                    if (message.timestamp != null && message.hasOwnProperty("timestamp")) {
                        var error = $root.google.protobuf.Timestamp.verify(message.timestamp);
                        if (error)
                            return "timestamp." + error;
                    }
                    if (message.mixHash != null && message.hasOwnProperty("mixHash")) {
                        var error = $root.apibara.ethereum.v1alpha2.H256.verify(message.mixHash);
                        if (error)
                            return "mixHash." + error;
                    }
                    if (message.nonce != null && message.hasOwnProperty("nonce"))
                        if (!$util.isInteger(message.nonce) && !(message.nonce && $util.isInteger(message.nonce.low) && $util.isInteger(message.nonce.high)))
                            return "nonce: integer|Long expected";
                    if (message.baseFeePerGas != null && message.hasOwnProperty("baseFeePerGas"))
                        if (!$util.isInteger(message.baseFeePerGas) && !(message.baseFeePerGas && $util.isInteger(message.baseFeePerGas.low) && $util.isInteger(message.baseFeePerGas.high)))
                            return "baseFeePerGas: integer|Long expected";
                    if (message.extraData != null && message.hasOwnProperty("extraData"))
                        if (!(message.extraData && typeof message.extraData.length === "number" || $util.isString(message.extraData)))
                            return "extraData: buffer expected";
                    return null;
                };

                /**
                 * Creates a BlockHeader message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {apibara.ethereum.v1alpha2.BlockHeader} BlockHeader
                 */
                BlockHeader.fromObject = function fromObject(object) {
                    if (object instanceof $root.apibara.ethereum.v1alpha2.BlockHeader)
                        return object;
                    var message = new $root.apibara.ethereum.v1alpha2.BlockHeader();
                    if (object.blockHash != null) {
                        if (typeof object.blockHash !== "object")
                            throw TypeError(".apibara.ethereum.v1alpha2.BlockHeader.blockHash: object expected");
                        message.blockHash = $root.apibara.ethereum.v1alpha2.H256.fromObject(object.blockHash);
                    }
                    if (object.parentBlockHash != null) {
                        if (typeof object.parentBlockHash !== "object")
                            throw TypeError(".apibara.ethereum.v1alpha2.BlockHeader.parentBlockHash: object expected");
                        message.parentBlockHash = $root.apibara.ethereum.v1alpha2.H256.fromObject(object.parentBlockHash);
                    }
                    if (object.ommersHash != null) {
                        if (typeof object.ommersHash !== "object")
                            throw TypeError(".apibara.ethereum.v1alpha2.BlockHeader.ommersHash: object expected");
                        message.ommersHash = $root.apibara.ethereum.v1alpha2.H256.fromObject(object.ommersHash);
                    }
                    if (object.beneficiary != null) {
                        if (typeof object.beneficiary !== "object")
                            throw TypeError(".apibara.ethereum.v1alpha2.BlockHeader.beneficiary: object expected");
                        message.beneficiary = $root.apibara.ethereum.v1alpha2.H160.fromObject(object.beneficiary);
                    }
                    if (object.stateRoot != null) {
                        if (typeof object.stateRoot !== "object")
                            throw TypeError(".apibara.ethereum.v1alpha2.BlockHeader.stateRoot: object expected");
                        message.stateRoot = $root.apibara.ethereum.v1alpha2.H256.fromObject(object.stateRoot);
                    }
                    if (object.transactionsRoot != null) {
                        if (typeof object.transactionsRoot !== "object")
                            throw TypeError(".apibara.ethereum.v1alpha2.BlockHeader.transactionsRoot: object expected");
                        message.transactionsRoot = $root.apibara.ethereum.v1alpha2.H256.fromObject(object.transactionsRoot);
                    }
                    if (object.receiptsRoot != null) {
                        if (typeof object.receiptsRoot !== "object")
                            throw TypeError(".apibara.ethereum.v1alpha2.BlockHeader.receiptsRoot: object expected");
                        message.receiptsRoot = $root.apibara.ethereum.v1alpha2.H256.fromObject(object.receiptsRoot);
                    }
                    if (object.withdrawalsRoot != null) {
                        if (typeof object.withdrawalsRoot !== "object")
                            throw TypeError(".apibara.ethereum.v1alpha2.BlockHeader.withdrawalsRoot: object expected");
                        message.withdrawalsRoot = $root.apibara.ethereum.v1alpha2.H256.fromObject(object.withdrawalsRoot);
                    }
                    if (object.logsBloom != null)
                        if (typeof object.logsBloom === "string")
                            $util.base64.decode(object.logsBloom, message.logsBloom = $util.newBuffer($util.base64.length(object.logsBloom)), 0);
                        else if (object.logsBloom.length >= 0)
                            message.logsBloom = object.logsBloom;
                    if (object.difficulty != null)
                        if ($util.Long)
                            (message.difficulty = $util.Long.fromValue(object.difficulty)).unsigned = true;
                        else if (typeof object.difficulty === "string")
                            message.difficulty = parseInt(object.difficulty, 10);
                        else if (typeof object.difficulty === "number")
                            message.difficulty = object.difficulty;
                        else if (typeof object.difficulty === "object")
                            message.difficulty = new $util.LongBits(object.difficulty.low >>> 0, object.difficulty.high >>> 0).toNumber(true);
                    if (object.blockNumber != null)
                        if ($util.Long)
                            (message.blockNumber = $util.Long.fromValue(object.blockNumber)).unsigned = true;
                        else if (typeof object.blockNumber === "string")
                            message.blockNumber = parseInt(object.blockNumber, 10);
                        else if (typeof object.blockNumber === "number")
                            message.blockNumber = object.blockNumber;
                        else if (typeof object.blockNumber === "object")
                            message.blockNumber = new $util.LongBits(object.blockNumber.low >>> 0, object.blockNumber.high >>> 0).toNumber(true);
                    if (object.gasLimit != null)
                        if ($util.Long)
                            (message.gasLimit = $util.Long.fromValue(object.gasLimit)).unsigned = true;
                        else if (typeof object.gasLimit === "string")
                            message.gasLimit = parseInt(object.gasLimit, 10);
                        else if (typeof object.gasLimit === "number")
                            message.gasLimit = object.gasLimit;
                        else if (typeof object.gasLimit === "object")
                            message.gasLimit = new $util.LongBits(object.gasLimit.low >>> 0, object.gasLimit.high >>> 0).toNumber(true);
                    if (object.gasUsed != null)
                        if ($util.Long)
                            (message.gasUsed = $util.Long.fromValue(object.gasUsed)).unsigned = true;
                        else if (typeof object.gasUsed === "string")
                            message.gasUsed = parseInt(object.gasUsed, 10);
                        else if (typeof object.gasUsed === "number")
                            message.gasUsed = object.gasUsed;
                        else if (typeof object.gasUsed === "object")
                            message.gasUsed = new $util.LongBits(object.gasUsed.low >>> 0, object.gasUsed.high >>> 0).toNumber(true);
                    if (object.timestamp != null) {
                        if (typeof object.timestamp !== "object")
                            throw TypeError(".apibara.ethereum.v1alpha2.BlockHeader.timestamp: object expected");
                        message.timestamp = $root.google.protobuf.Timestamp.fromObject(object.timestamp);
                    }
                    if (object.mixHash != null) {
                        if (typeof object.mixHash !== "object")
                            throw TypeError(".apibara.ethereum.v1alpha2.BlockHeader.mixHash: object expected");
                        message.mixHash = $root.apibara.ethereum.v1alpha2.H256.fromObject(object.mixHash);
                    }
                    if (object.nonce != null)
                        if ($util.Long)
                            (message.nonce = $util.Long.fromValue(object.nonce)).unsigned = true;
                        else if (typeof object.nonce === "string")
                            message.nonce = parseInt(object.nonce, 10);
                        else if (typeof object.nonce === "number")
                            message.nonce = object.nonce;
                        else if (typeof object.nonce === "object")
                            message.nonce = new $util.LongBits(object.nonce.low >>> 0, object.nonce.high >>> 0).toNumber(true);
                    if (object.baseFeePerGas != null)
                        if ($util.Long)
                            (message.baseFeePerGas = $util.Long.fromValue(object.baseFeePerGas)).unsigned = true;
                        else if (typeof object.baseFeePerGas === "string")
                            message.baseFeePerGas = parseInt(object.baseFeePerGas, 10);
                        else if (typeof object.baseFeePerGas === "number")
                            message.baseFeePerGas = object.baseFeePerGas;
                        else if (typeof object.baseFeePerGas === "object")
                            message.baseFeePerGas = new $util.LongBits(object.baseFeePerGas.low >>> 0, object.baseFeePerGas.high >>> 0).toNumber(true);
                    if (object.extraData != null)
                        if (typeof object.extraData === "string")
                            $util.base64.decode(object.extraData, message.extraData = $util.newBuffer($util.base64.length(object.extraData)), 0);
                        else if (object.extraData.length >= 0)
                            message.extraData = object.extraData;
                    return message;
                };

                /**
                 * Creates a plain object from a BlockHeader message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @static
                 * @param {apibara.ethereum.v1alpha2.BlockHeader} message BlockHeader
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                BlockHeader.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.blockHash = null;
                        object.parentBlockHash = null;
                        object.ommersHash = null;
                        object.beneficiary = null;
                        object.stateRoot = null;
                        object.transactionsRoot = null;
                        object.receiptsRoot = null;
                        object.withdrawalsRoot = null;
                        if (options.bytes === String)
                            object.logsBloom = "";
                        else {
                            object.logsBloom = [];
                            if (options.bytes !== Array)
                                object.logsBloom = $util.newBuffer(object.logsBloom);
                        }
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, true);
                            object.difficulty = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.difficulty = options.longs === String ? "0" : 0;
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, true);
                            object.blockNumber = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.blockNumber = options.longs === String ? "0" : 0;
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, true);
                            object.gasLimit = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.gasLimit = options.longs === String ? "0" : 0;
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, true);
                            object.gasUsed = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.gasUsed = options.longs === String ? "0" : 0;
                        object.timestamp = null;
                        object.mixHash = null;
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, true);
                            object.nonce = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.nonce = options.longs === String ? "0" : 0;
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, true);
                            object.baseFeePerGas = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.baseFeePerGas = options.longs === String ? "0" : 0;
                        if (options.bytes === String)
                            object.extraData = "";
                        else {
                            object.extraData = [];
                            if (options.bytes !== Array)
                                object.extraData = $util.newBuffer(object.extraData);
                        }
                    }
                    if (message.blockHash != null && message.hasOwnProperty("blockHash"))
                        object.blockHash = $root.apibara.ethereum.v1alpha2.H256.toObject(message.blockHash, options);
                    if (message.parentBlockHash != null && message.hasOwnProperty("parentBlockHash"))
                        object.parentBlockHash = $root.apibara.ethereum.v1alpha2.H256.toObject(message.parentBlockHash, options);
                    if (message.ommersHash != null && message.hasOwnProperty("ommersHash"))
                        object.ommersHash = $root.apibara.ethereum.v1alpha2.H256.toObject(message.ommersHash, options);
                    if (message.beneficiary != null && message.hasOwnProperty("beneficiary"))
                        object.beneficiary = $root.apibara.ethereum.v1alpha2.H160.toObject(message.beneficiary, options);
                    if (message.stateRoot != null && message.hasOwnProperty("stateRoot"))
                        object.stateRoot = $root.apibara.ethereum.v1alpha2.H256.toObject(message.stateRoot, options);
                    if (message.transactionsRoot != null && message.hasOwnProperty("transactionsRoot"))
                        object.transactionsRoot = $root.apibara.ethereum.v1alpha2.H256.toObject(message.transactionsRoot, options);
                    if (message.receiptsRoot != null && message.hasOwnProperty("receiptsRoot"))
                        object.receiptsRoot = $root.apibara.ethereum.v1alpha2.H256.toObject(message.receiptsRoot, options);
                    if (message.withdrawalsRoot != null && message.hasOwnProperty("withdrawalsRoot"))
                        object.withdrawalsRoot = $root.apibara.ethereum.v1alpha2.H256.toObject(message.withdrawalsRoot, options);
                    if (message.logsBloom != null && message.hasOwnProperty("logsBloom"))
                        object.logsBloom = options.bytes === String ? $util.base64.encode(message.logsBloom, 0, message.logsBloom.length) : options.bytes === Array ? Array.prototype.slice.call(message.logsBloom) : message.logsBloom;
                    if (message.difficulty != null && message.hasOwnProperty("difficulty"))
                        if (typeof message.difficulty === "number")
                            object.difficulty = options.longs === String ? String(message.difficulty) : message.difficulty;
                        else
                            object.difficulty = options.longs === String ? $util.Long.prototype.toString.call(message.difficulty) : options.longs === Number ? new $util.LongBits(message.difficulty.low >>> 0, message.difficulty.high >>> 0).toNumber(true) : message.difficulty;
                    if (message.blockNumber != null && message.hasOwnProperty("blockNumber"))
                        if (typeof message.blockNumber === "number")
                            object.blockNumber = options.longs === String ? String(message.blockNumber) : message.blockNumber;
                        else
                            object.blockNumber = options.longs === String ? $util.Long.prototype.toString.call(message.blockNumber) : options.longs === Number ? new $util.LongBits(message.blockNumber.low >>> 0, message.blockNumber.high >>> 0).toNumber(true) : message.blockNumber;
                    if (message.gasLimit != null && message.hasOwnProperty("gasLimit"))
                        if (typeof message.gasLimit === "number")
                            object.gasLimit = options.longs === String ? String(message.gasLimit) : message.gasLimit;
                        else
                            object.gasLimit = options.longs === String ? $util.Long.prototype.toString.call(message.gasLimit) : options.longs === Number ? new $util.LongBits(message.gasLimit.low >>> 0, message.gasLimit.high >>> 0).toNumber(true) : message.gasLimit;
                    if (message.gasUsed != null && message.hasOwnProperty("gasUsed"))
                        if (typeof message.gasUsed === "number")
                            object.gasUsed = options.longs === String ? String(message.gasUsed) : message.gasUsed;
                        else
                            object.gasUsed = options.longs === String ? $util.Long.prototype.toString.call(message.gasUsed) : options.longs === Number ? new $util.LongBits(message.gasUsed.low >>> 0, message.gasUsed.high >>> 0).toNumber(true) : message.gasUsed;
                    if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                        object.timestamp = $root.google.protobuf.Timestamp.toObject(message.timestamp, options);
                    if (message.mixHash != null && message.hasOwnProperty("mixHash"))
                        object.mixHash = $root.apibara.ethereum.v1alpha2.H256.toObject(message.mixHash, options);
                    if (message.nonce != null && message.hasOwnProperty("nonce"))
                        if (typeof message.nonce === "number")
                            object.nonce = options.longs === String ? String(message.nonce) : message.nonce;
                        else
                            object.nonce = options.longs === String ? $util.Long.prototype.toString.call(message.nonce) : options.longs === Number ? new $util.LongBits(message.nonce.low >>> 0, message.nonce.high >>> 0).toNumber(true) : message.nonce;
                    if (message.baseFeePerGas != null && message.hasOwnProperty("baseFeePerGas"))
                        if (typeof message.baseFeePerGas === "number")
                            object.baseFeePerGas = options.longs === String ? String(message.baseFeePerGas) : message.baseFeePerGas;
                        else
                            object.baseFeePerGas = options.longs === String ? $util.Long.prototype.toString.call(message.baseFeePerGas) : options.longs === Number ? new $util.LongBits(message.baseFeePerGas.low >>> 0, message.baseFeePerGas.high >>> 0).toNumber(true) : message.baseFeePerGas;
                    if (message.extraData != null && message.hasOwnProperty("extraData"))
                        object.extraData = options.bytes === String ? $util.base64.encode(message.extraData, 0, message.extraData.length) : options.bytes === Array ? Array.prototype.slice.call(message.extraData) : message.extraData;
                    return object;
                };

                /**
                 * Converts this BlockHeader to JSON.
                 * @function toJSON
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                BlockHeader.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for BlockHeader
                 * @function getTypeUrl
                 * @memberof apibara.ethereum.v1alpha2.BlockHeader
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                BlockHeader.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/apibara.ethereum.v1alpha2.BlockHeader";
                };

                return BlockHeader;
            })();

            /**
             * BlockStatus enum.
             * @name apibara.ethereum.v1alpha2.BlockStatus
             * @enum {number}
             * @property {number} BLOCK_STATUS_UNSPECIFIED=0 BLOCK_STATUS_UNSPECIFIED value
             * @property {number} BLOCK_STATUS_PENDING=1 BLOCK_STATUS_PENDING value
             * @property {number} BLOCK_STATUS_ACCEPTED=2 BLOCK_STATUS_ACCEPTED value
             * @property {number} BLOCK_STATUS_SAFE=3 BLOCK_STATUS_SAFE value
             * @property {number} BLOCK_STATUS_FINALIZED=4 BLOCK_STATUS_FINALIZED value
             * @property {number} BLOCK_STATUS_REJECTED=5 BLOCK_STATUS_REJECTED value
             */
            v1alpha2.BlockStatus = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "BLOCK_STATUS_UNSPECIFIED"] = 0;
                values[valuesById[1] = "BLOCK_STATUS_PENDING"] = 1;
                values[valuesById[2] = "BLOCK_STATUS_ACCEPTED"] = 2;
                values[valuesById[3] = "BLOCK_STATUS_SAFE"] = 3;
                values[valuesById[4] = "BLOCK_STATUS_FINALIZED"] = 4;
                values[valuesById[5] = "BLOCK_STATUS_REJECTED"] = 5;
                return values;
            })();

            v1alpha2.LogWithTransaction = (function() {

                /**
                 * Properties of a LogWithTransaction.
                 * @memberof apibara.ethereum.v1alpha2
                 * @interface ILogWithTransaction
                 * @property {apibara.ethereum.v1alpha2.ITransaction|null} [transaction] LogWithTransaction transaction
                 * @property {apibara.ethereum.v1alpha2.IReceipt|null} [receipt] LogWithTransaction receipt
                 * @property {apibara.ethereum.v1alpha2.ILog|null} [log] LogWithTransaction log
                 */

                /**
                 * Constructs a new LogWithTransaction.
                 * @memberof apibara.ethereum.v1alpha2
                 * @classdesc Represents a LogWithTransaction.
                 * @implements ILogWithTransaction
                 * @constructor
                 * @param {apibara.ethereum.v1alpha2.ILogWithTransaction=} [properties] Properties to set
                 */
                function LogWithTransaction(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * LogWithTransaction transaction.
                 * @member {apibara.ethereum.v1alpha2.ITransaction|null|undefined} transaction
                 * @memberof apibara.ethereum.v1alpha2.LogWithTransaction
                 * @instance
                 */
                LogWithTransaction.prototype.transaction = null;

                /**
                 * LogWithTransaction receipt.
                 * @member {apibara.ethereum.v1alpha2.IReceipt|null|undefined} receipt
                 * @memberof apibara.ethereum.v1alpha2.LogWithTransaction
                 * @instance
                 */
                LogWithTransaction.prototype.receipt = null;

                /**
                 * LogWithTransaction log.
                 * @member {apibara.ethereum.v1alpha2.ILog|null|undefined} log
                 * @memberof apibara.ethereum.v1alpha2.LogWithTransaction
                 * @instance
                 */
                LogWithTransaction.prototype.log = null;

                /**
                 * Creates a new LogWithTransaction instance using the specified properties.
                 * @function create
                 * @memberof apibara.ethereum.v1alpha2.LogWithTransaction
                 * @static
                 * @param {apibara.ethereum.v1alpha2.ILogWithTransaction=} [properties] Properties to set
                 * @returns {apibara.ethereum.v1alpha2.LogWithTransaction} LogWithTransaction instance
                 */
                LogWithTransaction.create = function create(properties) {
                    return new LogWithTransaction(properties);
                };

                /**
                 * Encodes the specified LogWithTransaction message. Does not implicitly {@link apibara.ethereum.v1alpha2.LogWithTransaction.verify|verify} messages.
                 * @function encode
                 * @memberof apibara.ethereum.v1alpha2.LogWithTransaction
                 * @static
                 * @param {apibara.ethereum.v1alpha2.ILogWithTransaction} message LogWithTransaction message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                LogWithTransaction.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.transaction != null && Object.hasOwnProperty.call(message, "transaction"))
                        $root.apibara.ethereum.v1alpha2.Transaction.encode(message.transaction, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                    if (message.receipt != null && Object.hasOwnProperty.call(message, "receipt"))
                        $root.apibara.ethereum.v1alpha2.Receipt.encode(message.receipt, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                    if (message.log != null && Object.hasOwnProperty.call(message, "log"))
                        $root.apibara.ethereum.v1alpha2.Log.encode(message.log, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                    return writer;
                };

                /**
                 * Encodes the specified LogWithTransaction message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.LogWithTransaction.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.LogWithTransaction
                 * @static
                 * @param {apibara.ethereum.v1alpha2.ILogWithTransaction} message LogWithTransaction message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                LogWithTransaction.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a LogWithTransaction message from the specified reader or buffer.
                 * @function decode
                 * @memberof apibara.ethereum.v1alpha2.LogWithTransaction
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {apibara.ethereum.v1alpha2.LogWithTransaction} LogWithTransaction
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                LogWithTransaction.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.apibara.ethereum.v1alpha2.LogWithTransaction();
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1: {
                                message.transaction = $root.apibara.ethereum.v1alpha2.Transaction.decode(reader, reader.uint32());
                                break;
                            }
                        case 2: {
                                message.receipt = $root.apibara.ethereum.v1alpha2.Receipt.decode(reader, reader.uint32());
                                break;
                            }
                        case 3: {
                                message.log = $root.apibara.ethereum.v1alpha2.Log.decode(reader, reader.uint32());
                                break;
                            }
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a LogWithTransaction message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.LogWithTransaction
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {apibara.ethereum.v1alpha2.LogWithTransaction} LogWithTransaction
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                LogWithTransaction.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a LogWithTransaction message.
                 * @function verify
                 * @memberof apibara.ethereum.v1alpha2.LogWithTransaction
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                LogWithTransaction.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.transaction != null && message.hasOwnProperty("transaction")) {
                        var error = $root.apibara.ethereum.v1alpha2.Transaction.verify(message.transaction);
                        if (error)
                            return "transaction." + error;
                    }
                    if (message.receipt != null && message.hasOwnProperty("receipt")) {
                        var error = $root.apibara.ethereum.v1alpha2.Receipt.verify(message.receipt);
                        if (error)
                            return "receipt." + error;
                    }
                    if (message.log != null && message.hasOwnProperty("log")) {
                        var error = $root.apibara.ethereum.v1alpha2.Log.verify(message.log);
                        if (error)
                            return "log." + error;
                    }
                    return null;
                };

                /**
                 * Creates a LogWithTransaction message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof apibara.ethereum.v1alpha2.LogWithTransaction
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {apibara.ethereum.v1alpha2.LogWithTransaction} LogWithTransaction
                 */
                LogWithTransaction.fromObject = function fromObject(object) {
                    if (object instanceof $root.apibara.ethereum.v1alpha2.LogWithTransaction)
                        return object;
                    var message = new $root.apibara.ethereum.v1alpha2.LogWithTransaction();
                    if (object.transaction != null) {
                        if (typeof object.transaction !== "object")
                            throw TypeError(".apibara.ethereum.v1alpha2.LogWithTransaction.transaction: object expected");
                        message.transaction = $root.apibara.ethereum.v1alpha2.Transaction.fromObject(object.transaction);
                    }
                    if (object.receipt != null) {
                        if (typeof object.receipt !== "object")
                            throw TypeError(".apibara.ethereum.v1alpha2.LogWithTransaction.receipt: object expected");
                        message.receipt = $root.apibara.ethereum.v1alpha2.Receipt.fromObject(object.receipt);
                    }
                    if (object.log != null) {
                        if (typeof object.log !== "object")
                            throw TypeError(".apibara.ethereum.v1alpha2.LogWithTransaction.log: object expected");
                        message.log = $root.apibara.ethereum.v1alpha2.Log.fromObject(object.log);
                    }
                    return message;
                };

                /**
                 * Creates a plain object from a LogWithTransaction message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof apibara.ethereum.v1alpha2.LogWithTransaction
                 * @static
                 * @param {apibara.ethereum.v1alpha2.LogWithTransaction} message LogWithTransaction
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                LogWithTransaction.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.transaction = null;
                        object.receipt = null;
                        object.log = null;
                    }
                    if (message.transaction != null && message.hasOwnProperty("transaction"))
                        object.transaction = $root.apibara.ethereum.v1alpha2.Transaction.toObject(message.transaction, options);
                    if (message.receipt != null && message.hasOwnProperty("receipt"))
                        object.receipt = $root.apibara.ethereum.v1alpha2.Receipt.toObject(message.receipt, options);
                    if (message.log != null && message.hasOwnProperty("log"))
                        object.log = $root.apibara.ethereum.v1alpha2.Log.toObject(message.log, options);
                    return object;
                };

                /**
                 * Converts this LogWithTransaction to JSON.
                 * @function toJSON
                 * @memberof apibara.ethereum.v1alpha2.LogWithTransaction
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                LogWithTransaction.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for LogWithTransaction
                 * @function getTypeUrl
                 * @memberof apibara.ethereum.v1alpha2.LogWithTransaction
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                LogWithTransaction.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/apibara.ethereum.v1alpha2.LogWithTransaction";
                };

                return LogWithTransaction;
            })();

            v1alpha2.Transaction = (function() {

                /**
                 * Properties of a Transaction.
                 * @memberof apibara.ethereum.v1alpha2
                 * @interface ITransaction
                 */

                /**
                 * Constructs a new Transaction.
                 * @memberof apibara.ethereum.v1alpha2
                 * @classdesc Represents a Transaction.
                 * @implements ITransaction
                 * @constructor
                 * @param {apibara.ethereum.v1alpha2.ITransaction=} [properties] Properties to set
                 */
                function Transaction(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Creates a new Transaction instance using the specified properties.
                 * @function create
                 * @memberof apibara.ethereum.v1alpha2.Transaction
                 * @static
                 * @param {apibara.ethereum.v1alpha2.ITransaction=} [properties] Properties to set
                 * @returns {apibara.ethereum.v1alpha2.Transaction} Transaction instance
                 */
                Transaction.create = function create(properties) {
                    return new Transaction(properties);
                };

                /**
                 * Encodes the specified Transaction message. Does not implicitly {@link apibara.ethereum.v1alpha2.Transaction.verify|verify} messages.
                 * @function encode
                 * @memberof apibara.ethereum.v1alpha2.Transaction
                 * @static
                 * @param {apibara.ethereum.v1alpha2.ITransaction} message Transaction message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Transaction.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    return writer;
                };

                /**
                 * Encodes the specified Transaction message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.Transaction.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.Transaction
                 * @static
                 * @param {apibara.ethereum.v1alpha2.ITransaction} message Transaction message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Transaction.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a Transaction message from the specified reader or buffer.
                 * @function decode
                 * @memberof apibara.ethereum.v1alpha2.Transaction
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {apibara.ethereum.v1alpha2.Transaction} Transaction
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Transaction.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.apibara.ethereum.v1alpha2.Transaction();
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a Transaction message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.Transaction
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {apibara.ethereum.v1alpha2.Transaction} Transaction
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Transaction.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a Transaction message.
                 * @function verify
                 * @memberof apibara.ethereum.v1alpha2.Transaction
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                Transaction.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    return null;
                };

                /**
                 * Creates a Transaction message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof apibara.ethereum.v1alpha2.Transaction
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {apibara.ethereum.v1alpha2.Transaction} Transaction
                 */
                Transaction.fromObject = function fromObject(object) {
                    if (object instanceof $root.apibara.ethereum.v1alpha2.Transaction)
                        return object;
                    return new $root.apibara.ethereum.v1alpha2.Transaction();
                };

                /**
                 * Creates a plain object from a Transaction message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof apibara.ethereum.v1alpha2.Transaction
                 * @static
                 * @param {apibara.ethereum.v1alpha2.Transaction} message Transaction
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Transaction.toObject = function toObject() {
                    return {};
                };

                /**
                 * Converts this Transaction to JSON.
                 * @function toJSON
                 * @memberof apibara.ethereum.v1alpha2.Transaction
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Transaction.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for Transaction
                 * @function getTypeUrl
                 * @memberof apibara.ethereum.v1alpha2.Transaction
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Transaction.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/apibara.ethereum.v1alpha2.Transaction";
                };

                return Transaction;
            })();

            v1alpha2.Receipt = (function() {

                /**
                 * Properties of a Receipt.
                 * @memberof apibara.ethereum.v1alpha2
                 * @interface IReceipt
                 */

                /**
                 * Constructs a new Receipt.
                 * @memberof apibara.ethereum.v1alpha2
                 * @classdesc Represents a Receipt.
                 * @implements IReceipt
                 * @constructor
                 * @param {apibara.ethereum.v1alpha2.IReceipt=} [properties] Properties to set
                 */
                function Receipt(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Creates a new Receipt instance using the specified properties.
                 * @function create
                 * @memberof apibara.ethereum.v1alpha2.Receipt
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IReceipt=} [properties] Properties to set
                 * @returns {apibara.ethereum.v1alpha2.Receipt} Receipt instance
                 */
                Receipt.create = function create(properties) {
                    return new Receipt(properties);
                };

                /**
                 * Encodes the specified Receipt message. Does not implicitly {@link apibara.ethereum.v1alpha2.Receipt.verify|verify} messages.
                 * @function encode
                 * @memberof apibara.ethereum.v1alpha2.Receipt
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IReceipt} message Receipt message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Receipt.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    return writer;
                };

                /**
                 * Encodes the specified Receipt message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.Receipt.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.Receipt
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IReceipt} message Receipt message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Receipt.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a Receipt message from the specified reader or buffer.
                 * @function decode
                 * @memberof apibara.ethereum.v1alpha2.Receipt
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {apibara.ethereum.v1alpha2.Receipt} Receipt
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Receipt.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.apibara.ethereum.v1alpha2.Receipt();
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a Receipt message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.Receipt
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {apibara.ethereum.v1alpha2.Receipt} Receipt
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Receipt.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a Receipt message.
                 * @function verify
                 * @memberof apibara.ethereum.v1alpha2.Receipt
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                Receipt.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    return null;
                };

                /**
                 * Creates a Receipt message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof apibara.ethereum.v1alpha2.Receipt
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {apibara.ethereum.v1alpha2.Receipt} Receipt
                 */
                Receipt.fromObject = function fromObject(object) {
                    if (object instanceof $root.apibara.ethereum.v1alpha2.Receipt)
                        return object;
                    return new $root.apibara.ethereum.v1alpha2.Receipt();
                };

                /**
                 * Creates a plain object from a Receipt message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof apibara.ethereum.v1alpha2.Receipt
                 * @static
                 * @param {apibara.ethereum.v1alpha2.Receipt} message Receipt
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Receipt.toObject = function toObject() {
                    return {};
                };

                /**
                 * Converts this Receipt to JSON.
                 * @function toJSON
                 * @memberof apibara.ethereum.v1alpha2.Receipt
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Receipt.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for Receipt
                 * @function getTypeUrl
                 * @memberof apibara.ethereum.v1alpha2.Receipt
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Receipt.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/apibara.ethereum.v1alpha2.Receipt";
                };

                return Receipt;
            })();

            v1alpha2.Log = (function() {

                /**
                 * Properties of a Log.
                 * @memberof apibara.ethereum.v1alpha2
                 * @interface ILog
                 * @property {apibara.ethereum.v1alpha2.IH160|null} [address] Log address
                 * @property {Array.<apibara.ethereum.v1alpha2.IH256>|null} [topics] Log topics
                 * @property {Uint8Array|null} [data] Log data
                 */

                /**
                 * Constructs a new Log.
                 * @memberof apibara.ethereum.v1alpha2
                 * @classdesc Represents a Log.
                 * @implements ILog
                 * @constructor
                 * @param {apibara.ethereum.v1alpha2.ILog=} [properties] Properties to set
                 */
                function Log(properties) {
                    this.topics = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Log address.
                 * @member {apibara.ethereum.v1alpha2.IH160|null|undefined} address
                 * @memberof apibara.ethereum.v1alpha2.Log
                 * @instance
                 */
                Log.prototype.address = null;

                /**
                 * Log topics.
                 * @member {Array.<apibara.ethereum.v1alpha2.IH256>} topics
                 * @memberof apibara.ethereum.v1alpha2.Log
                 * @instance
                 */
                Log.prototype.topics = $util.emptyArray;

                /**
                 * Log data.
                 * @member {Uint8Array} data
                 * @memberof apibara.ethereum.v1alpha2.Log
                 * @instance
                 */
                Log.prototype.data = $util.newBuffer([]);

                /**
                 * Creates a new Log instance using the specified properties.
                 * @function create
                 * @memberof apibara.ethereum.v1alpha2.Log
                 * @static
                 * @param {apibara.ethereum.v1alpha2.ILog=} [properties] Properties to set
                 * @returns {apibara.ethereum.v1alpha2.Log} Log instance
                 */
                Log.create = function create(properties) {
                    return new Log(properties);
                };

                /**
                 * Encodes the specified Log message. Does not implicitly {@link apibara.ethereum.v1alpha2.Log.verify|verify} messages.
                 * @function encode
                 * @memberof apibara.ethereum.v1alpha2.Log
                 * @static
                 * @param {apibara.ethereum.v1alpha2.ILog} message Log message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Log.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.address != null && Object.hasOwnProperty.call(message, "address"))
                        $root.apibara.ethereum.v1alpha2.H160.encode(message.address, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                    if (message.topics != null && message.topics.length)
                        for (var i = 0; i < message.topics.length; ++i)
                            $root.apibara.ethereum.v1alpha2.H256.encode(message.topics[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                    if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                        writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.data);
                    return writer;
                };

                /**
                 * Encodes the specified Log message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.Log.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.Log
                 * @static
                 * @param {apibara.ethereum.v1alpha2.ILog} message Log message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Log.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a Log message from the specified reader or buffer.
                 * @function decode
                 * @memberof apibara.ethereum.v1alpha2.Log
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {apibara.ethereum.v1alpha2.Log} Log
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Log.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.apibara.ethereum.v1alpha2.Log();
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1: {
                                message.address = $root.apibara.ethereum.v1alpha2.H160.decode(reader, reader.uint32());
                                break;
                            }
                        case 2: {
                                if (!(message.topics && message.topics.length))
                                    message.topics = [];
                                message.topics.push($root.apibara.ethereum.v1alpha2.H256.decode(reader, reader.uint32()));
                                break;
                            }
                        case 3: {
                                message.data = reader.bytes();
                                break;
                            }
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a Log message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.Log
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {apibara.ethereum.v1alpha2.Log} Log
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Log.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a Log message.
                 * @function verify
                 * @memberof apibara.ethereum.v1alpha2.Log
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                Log.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.address != null && message.hasOwnProperty("address")) {
                        var error = $root.apibara.ethereum.v1alpha2.H160.verify(message.address);
                        if (error)
                            return "address." + error;
                    }
                    if (message.topics != null && message.hasOwnProperty("topics")) {
                        if (!Array.isArray(message.topics))
                            return "topics: array expected";
                        for (var i = 0; i < message.topics.length; ++i) {
                            var error = $root.apibara.ethereum.v1alpha2.H256.verify(message.topics[i]);
                            if (error)
                                return "topics." + error;
                        }
                    }
                    if (message.data != null && message.hasOwnProperty("data"))
                        if (!(message.data && typeof message.data.length === "number" || $util.isString(message.data)))
                            return "data: buffer expected";
                    return null;
                };

                /**
                 * Creates a Log message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof apibara.ethereum.v1alpha2.Log
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {apibara.ethereum.v1alpha2.Log} Log
                 */
                Log.fromObject = function fromObject(object) {
                    if (object instanceof $root.apibara.ethereum.v1alpha2.Log)
                        return object;
                    var message = new $root.apibara.ethereum.v1alpha2.Log();
                    if (object.address != null) {
                        if (typeof object.address !== "object")
                            throw TypeError(".apibara.ethereum.v1alpha2.Log.address: object expected");
                        message.address = $root.apibara.ethereum.v1alpha2.H160.fromObject(object.address);
                    }
                    if (object.topics) {
                        if (!Array.isArray(object.topics))
                            throw TypeError(".apibara.ethereum.v1alpha2.Log.topics: array expected");
                        message.topics = [];
                        for (var i = 0; i < object.topics.length; ++i) {
                            if (typeof object.topics[i] !== "object")
                                throw TypeError(".apibara.ethereum.v1alpha2.Log.topics: object expected");
                            message.topics[i] = $root.apibara.ethereum.v1alpha2.H256.fromObject(object.topics[i]);
                        }
                    }
                    if (object.data != null)
                        if (typeof object.data === "string")
                            $util.base64.decode(object.data, message.data = $util.newBuffer($util.base64.length(object.data)), 0);
                        else if (object.data.length >= 0)
                            message.data = object.data;
                    return message;
                };

                /**
                 * Creates a plain object from a Log message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof apibara.ethereum.v1alpha2.Log
                 * @static
                 * @param {apibara.ethereum.v1alpha2.Log} message Log
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Log.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.topics = [];
                    if (options.defaults) {
                        object.address = null;
                        if (options.bytes === String)
                            object.data = "";
                        else {
                            object.data = [];
                            if (options.bytes !== Array)
                                object.data = $util.newBuffer(object.data);
                        }
                    }
                    if (message.address != null && message.hasOwnProperty("address"))
                        object.address = $root.apibara.ethereum.v1alpha2.H160.toObject(message.address, options);
                    if (message.topics && message.topics.length) {
                        object.topics = [];
                        for (var j = 0; j < message.topics.length; ++j)
                            object.topics[j] = $root.apibara.ethereum.v1alpha2.H256.toObject(message.topics[j], options);
                    }
                    if (message.data != null && message.hasOwnProperty("data"))
                        object.data = options.bytes === String ? $util.base64.encode(message.data, 0, message.data.length) : options.bytes === Array ? Array.prototype.slice.call(message.data) : message.data;
                    return object;
                };

                /**
                 * Converts this Log to JSON.
                 * @function toJSON
                 * @memberof apibara.ethereum.v1alpha2.Log
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Log.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for Log
                 * @function getTypeUrl
                 * @memberof apibara.ethereum.v1alpha2.Log
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Log.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/apibara.ethereum.v1alpha2.Log";
                };

                return Log;
            })();

            v1alpha2.Filter = (function() {

                /**
                 * Properties of a Filter.
                 * @memberof apibara.ethereum.v1alpha2
                 * @interface IFilter
                 * @property {apibara.ethereum.v1alpha2.IHeaderFilter|null} [header] Filter header
                 * @property {Array.<apibara.ethereum.v1alpha2.ILogFilter>|null} [logs] Filter logs
                 */

                /**
                 * Constructs a new Filter.
                 * @memberof apibara.ethereum.v1alpha2
                 * @classdesc Represents a Filter.
                 * @implements IFilter
                 * @constructor
                 * @param {apibara.ethereum.v1alpha2.IFilter=} [properties] Properties to set
                 */
                function Filter(properties) {
                    this.logs = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Filter header.
                 * @member {apibara.ethereum.v1alpha2.IHeaderFilter|null|undefined} header
                 * @memberof apibara.ethereum.v1alpha2.Filter
                 * @instance
                 */
                Filter.prototype.header = null;

                /**
                 * Filter logs.
                 * @member {Array.<apibara.ethereum.v1alpha2.ILogFilter>} logs
                 * @memberof apibara.ethereum.v1alpha2.Filter
                 * @instance
                 */
                Filter.prototype.logs = $util.emptyArray;

                /**
                 * Creates a new Filter instance using the specified properties.
                 * @function create
                 * @memberof apibara.ethereum.v1alpha2.Filter
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IFilter=} [properties] Properties to set
                 * @returns {apibara.ethereum.v1alpha2.Filter} Filter instance
                 */
                Filter.create = function create(properties) {
                    return new Filter(properties);
                };

                /**
                 * Encodes the specified Filter message. Does not implicitly {@link apibara.ethereum.v1alpha2.Filter.verify|verify} messages.
                 * @function encode
                 * @memberof apibara.ethereum.v1alpha2.Filter
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IFilter} message Filter message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Filter.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.header != null && Object.hasOwnProperty.call(message, "header"))
                        $root.apibara.ethereum.v1alpha2.HeaderFilter.encode(message.header, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                    if (message.logs != null && message.logs.length)
                        for (var i = 0; i < message.logs.length; ++i)
                            $root.apibara.ethereum.v1alpha2.LogFilter.encode(message.logs[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                    return writer;
                };

                /**
                 * Encodes the specified Filter message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.Filter.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.Filter
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IFilter} message Filter message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Filter.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a Filter message from the specified reader or buffer.
                 * @function decode
                 * @memberof apibara.ethereum.v1alpha2.Filter
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {apibara.ethereum.v1alpha2.Filter} Filter
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Filter.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.apibara.ethereum.v1alpha2.Filter();
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1: {
                                message.header = $root.apibara.ethereum.v1alpha2.HeaderFilter.decode(reader, reader.uint32());
                                break;
                            }
                        case 2: {
                                if (!(message.logs && message.logs.length))
                                    message.logs = [];
                                message.logs.push($root.apibara.ethereum.v1alpha2.LogFilter.decode(reader, reader.uint32()));
                                break;
                            }
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a Filter message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.Filter
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {apibara.ethereum.v1alpha2.Filter} Filter
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Filter.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a Filter message.
                 * @function verify
                 * @memberof apibara.ethereum.v1alpha2.Filter
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                Filter.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.header != null && message.hasOwnProperty("header")) {
                        var error = $root.apibara.ethereum.v1alpha2.HeaderFilter.verify(message.header);
                        if (error)
                            return "header." + error;
                    }
                    if (message.logs != null && message.hasOwnProperty("logs")) {
                        if (!Array.isArray(message.logs))
                            return "logs: array expected";
                        for (var i = 0; i < message.logs.length; ++i) {
                            var error = $root.apibara.ethereum.v1alpha2.LogFilter.verify(message.logs[i]);
                            if (error)
                                return "logs." + error;
                        }
                    }
                    return null;
                };

                /**
                 * Creates a Filter message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof apibara.ethereum.v1alpha2.Filter
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {apibara.ethereum.v1alpha2.Filter} Filter
                 */
                Filter.fromObject = function fromObject(object) {
                    if (object instanceof $root.apibara.ethereum.v1alpha2.Filter)
                        return object;
                    var message = new $root.apibara.ethereum.v1alpha2.Filter();
                    if (object.header != null) {
                        if (typeof object.header !== "object")
                            throw TypeError(".apibara.ethereum.v1alpha2.Filter.header: object expected");
                        message.header = $root.apibara.ethereum.v1alpha2.HeaderFilter.fromObject(object.header);
                    }
                    if (object.logs) {
                        if (!Array.isArray(object.logs))
                            throw TypeError(".apibara.ethereum.v1alpha2.Filter.logs: array expected");
                        message.logs = [];
                        for (var i = 0; i < object.logs.length; ++i) {
                            if (typeof object.logs[i] !== "object")
                                throw TypeError(".apibara.ethereum.v1alpha2.Filter.logs: object expected");
                            message.logs[i] = $root.apibara.ethereum.v1alpha2.LogFilter.fromObject(object.logs[i]);
                        }
                    }
                    return message;
                };

                /**
                 * Creates a plain object from a Filter message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof apibara.ethereum.v1alpha2.Filter
                 * @static
                 * @param {apibara.ethereum.v1alpha2.Filter} message Filter
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Filter.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.logs = [];
                    if (options.defaults)
                        object.header = null;
                    if (message.header != null && message.hasOwnProperty("header"))
                        object.header = $root.apibara.ethereum.v1alpha2.HeaderFilter.toObject(message.header, options);
                    if (message.logs && message.logs.length) {
                        object.logs = [];
                        for (var j = 0; j < message.logs.length; ++j)
                            object.logs[j] = $root.apibara.ethereum.v1alpha2.LogFilter.toObject(message.logs[j], options);
                    }
                    return object;
                };

                /**
                 * Converts this Filter to JSON.
                 * @function toJSON
                 * @memberof apibara.ethereum.v1alpha2.Filter
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Filter.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for Filter
                 * @function getTypeUrl
                 * @memberof apibara.ethereum.v1alpha2.Filter
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Filter.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/apibara.ethereum.v1alpha2.Filter";
                };

                return Filter;
            })();

            v1alpha2.HeaderFilter = (function() {

                /**
                 * Properties of a HeaderFilter.
                 * @memberof apibara.ethereum.v1alpha2
                 * @interface IHeaderFilter
                 * @property {boolean|null} [weak] HeaderFilter weak
                 * @property {boolean|null} [rlp] HeaderFilter rlp
                 */

                /**
                 * Constructs a new HeaderFilter.
                 * @memberof apibara.ethereum.v1alpha2
                 * @classdesc Represents a HeaderFilter.
                 * @implements IHeaderFilter
                 * @constructor
                 * @param {apibara.ethereum.v1alpha2.IHeaderFilter=} [properties] Properties to set
                 */
                function HeaderFilter(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * HeaderFilter weak.
                 * @member {boolean} weak
                 * @memberof apibara.ethereum.v1alpha2.HeaderFilter
                 * @instance
                 */
                HeaderFilter.prototype.weak = false;

                /**
                 * HeaderFilter rlp.
                 * @member {boolean} rlp
                 * @memberof apibara.ethereum.v1alpha2.HeaderFilter
                 * @instance
                 */
                HeaderFilter.prototype.rlp = false;

                /**
                 * Creates a new HeaderFilter instance using the specified properties.
                 * @function create
                 * @memberof apibara.ethereum.v1alpha2.HeaderFilter
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IHeaderFilter=} [properties] Properties to set
                 * @returns {apibara.ethereum.v1alpha2.HeaderFilter} HeaderFilter instance
                 */
                HeaderFilter.create = function create(properties) {
                    return new HeaderFilter(properties);
                };

                /**
                 * Encodes the specified HeaderFilter message. Does not implicitly {@link apibara.ethereum.v1alpha2.HeaderFilter.verify|verify} messages.
                 * @function encode
                 * @memberof apibara.ethereum.v1alpha2.HeaderFilter
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IHeaderFilter} message HeaderFilter message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                HeaderFilter.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.weak != null && Object.hasOwnProperty.call(message, "weak"))
                        writer.uint32(/* id 1, wireType 0 =*/8).bool(message.weak);
                    if (message.rlp != null && Object.hasOwnProperty.call(message, "rlp"))
                        writer.uint32(/* id 2, wireType 0 =*/16).bool(message.rlp);
                    return writer;
                };

                /**
                 * Encodes the specified HeaderFilter message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.HeaderFilter.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.HeaderFilter
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IHeaderFilter} message HeaderFilter message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                HeaderFilter.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a HeaderFilter message from the specified reader or buffer.
                 * @function decode
                 * @memberof apibara.ethereum.v1alpha2.HeaderFilter
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {apibara.ethereum.v1alpha2.HeaderFilter} HeaderFilter
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                HeaderFilter.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.apibara.ethereum.v1alpha2.HeaderFilter();
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1: {
                                message.weak = reader.bool();
                                break;
                            }
                        case 2: {
                                message.rlp = reader.bool();
                                break;
                            }
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a HeaderFilter message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.HeaderFilter
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {apibara.ethereum.v1alpha2.HeaderFilter} HeaderFilter
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                HeaderFilter.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a HeaderFilter message.
                 * @function verify
                 * @memberof apibara.ethereum.v1alpha2.HeaderFilter
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                HeaderFilter.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.weak != null && message.hasOwnProperty("weak"))
                        if (typeof message.weak !== "boolean")
                            return "weak: boolean expected";
                    if (message.rlp != null && message.hasOwnProperty("rlp"))
                        if (typeof message.rlp !== "boolean")
                            return "rlp: boolean expected";
                    return null;
                };

                /**
                 * Creates a HeaderFilter message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof apibara.ethereum.v1alpha2.HeaderFilter
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {apibara.ethereum.v1alpha2.HeaderFilter} HeaderFilter
                 */
                HeaderFilter.fromObject = function fromObject(object) {
                    if (object instanceof $root.apibara.ethereum.v1alpha2.HeaderFilter)
                        return object;
                    var message = new $root.apibara.ethereum.v1alpha2.HeaderFilter();
                    if (object.weak != null)
                        message.weak = Boolean(object.weak);
                    if (object.rlp != null)
                        message.rlp = Boolean(object.rlp);
                    return message;
                };

                /**
                 * Creates a plain object from a HeaderFilter message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof apibara.ethereum.v1alpha2.HeaderFilter
                 * @static
                 * @param {apibara.ethereum.v1alpha2.HeaderFilter} message HeaderFilter
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                HeaderFilter.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.weak = false;
                        object.rlp = false;
                    }
                    if (message.weak != null && message.hasOwnProperty("weak"))
                        object.weak = message.weak;
                    if (message.rlp != null && message.hasOwnProperty("rlp"))
                        object.rlp = message.rlp;
                    return object;
                };

                /**
                 * Converts this HeaderFilter to JSON.
                 * @function toJSON
                 * @memberof apibara.ethereum.v1alpha2.HeaderFilter
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                HeaderFilter.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for HeaderFilter
                 * @function getTypeUrl
                 * @memberof apibara.ethereum.v1alpha2.HeaderFilter
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                HeaderFilter.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/apibara.ethereum.v1alpha2.HeaderFilter";
                };

                return HeaderFilter;
            })();

            v1alpha2.LogFilter = (function() {

                /**
                 * Properties of a LogFilter.
                 * @memberof apibara.ethereum.v1alpha2
                 * @interface ILogFilter
                 * @property {apibara.ethereum.v1alpha2.IH160|null} [address] LogFilter address
                 * @property {Array.<apibara.ethereum.v1alpha2.ITopicChoice>|null} [topics] LogFilter topics
                 */

                /**
                 * Constructs a new LogFilter.
                 * @memberof apibara.ethereum.v1alpha2
                 * @classdesc Represents a LogFilter.
                 * @implements ILogFilter
                 * @constructor
                 * @param {apibara.ethereum.v1alpha2.ILogFilter=} [properties] Properties to set
                 */
                function LogFilter(properties) {
                    this.topics = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * LogFilter address.
                 * @member {apibara.ethereum.v1alpha2.IH160|null|undefined} address
                 * @memberof apibara.ethereum.v1alpha2.LogFilter
                 * @instance
                 */
                LogFilter.prototype.address = null;

                /**
                 * LogFilter topics.
                 * @member {Array.<apibara.ethereum.v1alpha2.ITopicChoice>} topics
                 * @memberof apibara.ethereum.v1alpha2.LogFilter
                 * @instance
                 */
                LogFilter.prototype.topics = $util.emptyArray;

                /**
                 * Creates a new LogFilter instance using the specified properties.
                 * @function create
                 * @memberof apibara.ethereum.v1alpha2.LogFilter
                 * @static
                 * @param {apibara.ethereum.v1alpha2.ILogFilter=} [properties] Properties to set
                 * @returns {apibara.ethereum.v1alpha2.LogFilter} LogFilter instance
                 */
                LogFilter.create = function create(properties) {
                    return new LogFilter(properties);
                };

                /**
                 * Encodes the specified LogFilter message. Does not implicitly {@link apibara.ethereum.v1alpha2.LogFilter.verify|verify} messages.
                 * @function encode
                 * @memberof apibara.ethereum.v1alpha2.LogFilter
                 * @static
                 * @param {apibara.ethereum.v1alpha2.ILogFilter} message LogFilter message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                LogFilter.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.address != null && Object.hasOwnProperty.call(message, "address"))
                        $root.apibara.ethereum.v1alpha2.H160.encode(message.address, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                    if (message.topics != null && message.topics.length)
                        for (var i = 0; i < message.topics.length; ++i)
                            $root.apibara.ethereum.v1alpha2.TopicChoice.encode(message.topics[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                    return writer;
                };

                /**
                 * Encodes the specified LogFilter message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.LogFilter.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.LogFilter
                 * @static
                 * @param {apibara.ethereum.v1alpha2.ILogFilter} message LogFilter message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                LogFilter.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a LogFilter message from the specified reader or buffer.
                 * @function decode
                 * @memberof apibara.ethereum.v1alpha2.LogFilter
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {apibara.ethereum.v1alpha2.LogFilter} LogFilter
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                LogFilter.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.apibara.ethereum.v1alpha2.LogFilter();
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1: {
                                message.address = $root.apibara.ethereum.v1alpha2.H160.decode(reader, reader.uint32());
                                break;
                            }
                        case 2: {
                                if (!(message.topics && message.topics.length))
                                    message.topics = [];
                                message.topics.push($root.apibara.ethereum.v1alpha2.TopicChoice.decode(reader, reader.uint32()));
                                break;
                            }
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a LogFilter message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.LogFilter
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {apibara.ethereum.v1alpha2.LogFilter} LogFilter
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                LogFilter.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a LogFilter message.
                 * @function verify
                 * @memberof apibara.ethereum.v1alpha2.LogFilter
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                LogFilter.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.address != null && message.hasOwnProperty("address")) {
                        var error = $root.apibara.ethereum.v1alpha2.H160.verify(message.address);
                        if (error)
                            return "address." + error;
                    }
                    if (message.topics != null && message.hasOwnProperty("topics")) {
                        if (!Array.isArray(message.topics))
                            return "topics: array expected";
                        for (var i = 0; i < message.topics.length; ++i) {
                            var error = $root.apibara.ethereum.v1alpha2.TopicChoice.verify(message.topics[i]);
                            if (error)
                                return "topics." + error;
                        }
                    }
                    return null;
                };

                /**
                 * Creates a LogFilter message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof apibara.ethereum.v1alpha2.LogFilter
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {apibara.ethereum.v1alpha2.LogFilter} LogFilter
                 */
                LogFilter.fromObject = function fromObject(object) {
                    if (object instanceof $root.apibara.ethereum.v1alpha2.LogFilter)
                        return object;
                    var message = new $root.apibara.ethereum.v1alpha2.LogFilter();
                    if (object.address != null) {
                        if (typeof object.address !== "object")
                            throw TypeError(".apibara.ethereum.v1alpha2.LogFilter.address: object expected");
                        message.address = $root.apibara.ethereum.v1alpha2.H160.fromObject(object.address);
                    }
                    if (object.topics) {
                        if (!Array.isArray(object.topics))
                            throw TypeError(".apibara.ethereum.v1alpha2.LogFilter.topics: array expected");
                        message.topics = [];
                        for (var i = 0; i < object.topics.length; ++i) {
                            if (typeof object.topics[i] !== "object")
                                throw TypeError(".apibara.ethereum.v1alpha2.LogFilter.topics: object expected");
                            message.topics[i] = $root.apibara.ethereum.v1alpha2.TopicChoice.fromObject(object.topics[i]);
                        }
                    }
                    return message;
                };

                /**
                 * Creates a plain object from a LogFilter message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof apibara.ethereum.v1alpha2.LogFilter
                 * @static
                 * @param {apibara.ethereum.v1alpha2.LogFilter} message LogFilter
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                LogFilter.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.topics = [];
                    if (options.defaults)
                        object.address = null;
                    if (message.address != null && message.hasOwnProperty("address"))
                        object.address = $root.apibara.ethereum.v1alpha2.H160.toObject(message.address, options);
                    if (message.topics && message.topics.length) {
                        object.topics = [];
                        for (var j = 0; j < message.topics.length; ++j)
                            object.topics[j] = $root.apibara.ethereum.v1alpha2.TopicChoice.toObject(message.topics[j], options);
                    }
                    return object;
                };

                /**
                 * Converts this LogFilter to JSON.
                 * @function toJSON
                 * @memberof apibara.ethereum.v1alpha2.LogFilter
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                LogFilter.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for LogFilter
                 * @function getTypeUrl
                 * @memberof apibara.ethereum.v1alpha2.LogFilter
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                LogFilter.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/apibara.ethereum.v1alpha2.LogFilter";
                };

                return LogFilter;
            })();

            v1alpha2.TopicChoice = (function() {

                /**
                 * Properties of a TopicChoice.
                 * @memberof apibara.ethereum.v1alpha2
                 * @interface ITopicChoice
                 * @property {Array.<apibara.ethereum.v1alpha2.IH256>|null} [choices] TopicChoice choices
                 */

                /**
                 * Constructs a new TopicChoice.
                 * @memberof apibara.ethereum.v1alpha2
                 * @classdesc Represents a TopicChoice.
                 * @implements ITopicChoice
                 * @constructor
                 * @param {apibara.ethereum.v1alpha2.ITopicChoice=} [properties] Properties to set
                 */
                function TopicChoice(properties) {
                    this.choices = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * TopicChoice choices.
                 * @member {Array.<apibara.ethereum.v1alpha2.IH256>} choices
                 * @memberof apibara.ethereum.v1alpha2.TopicChoice
                 * @instance
                 */
                TopicChoice.prototype.choices = $util.emptyArray;

                /**
                 * Creates a new TopicChoice instance using the specified properties.
                 * @function create
                 * @memberof apibara.ethereum.v1alpha2.TopicChoice
                 * @static
                 * @param {apibara.ethereum.v1alpha2.ITopicChoice=} [properties] Properties to set
                 * @returns {apibara.ethereum.v1alpha2.TopicChoice} TopicChoice instance
                 */
                TopicChoice.create = function create(properties) {
                    return new TopicChoice(properties);
                };

                /**
                 * Encodes the specified TopicChoice message. Does not implicitly {@link apibara.ethereum.v1alpha2.TopicChoice.verify|verify} messages.
                 * @function encode
                 * @memberof apibara.ethereum.v1alpha2.TopicChoice
                 * @static
                 * @param {apibara.ethereum.v1alpha2.ITopicChoice} message TopicChoice message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                TopicChoice.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.choices != null && message.choices.length)
                        for (var i = 0; i < message.choices.length; ++i)
                            $root.apibara.ethereum.v1alpha2.H256.encode(message.choices[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                    return writer;
                };

                /**
                 * Encodes the specified TopicChoice message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.TopicChoice.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.TopicChoice
                 * @static
                 * @param {apibara.ethereum.v1alpha2.ITopicChoice} message TopicChoice message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                TopicChoice.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a TopicChoice message from the specified reader or buffer.
                 * @function decode
                 * @memberof apibara.ethereum.v1alpha2.TopicChoice
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {apibara.ethereum.v1alpha2.TopicChoice} TopicChoice
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                TopicChoice.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.apibara.ethereum.v1alpha2.TopicChoice();
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1: {
                                if (!(message.choices && message.choices.length))
                                    message.choices = [];
                                message.choices.push($root.apibara.ethereum.v1alpha2.H256.decode(reader, reader.uint32()));
                                break;
                            }
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a TopicChoice message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.TopicChoice
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {apibara.ethereum.v1alpha2.TopicChoice} TopicChoice
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                TopicChoice.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a TopicChoice message.
                 * @function verify
                 * @memberof apibara.ethereum.v1alpha2.TopicChoice
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                TopicChoice.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.choices != null && message.hasOwnProperty("choices")) {
                        if (!Array.isArray(message.choices))
                            return "choices: array expected";
                        for (var i = 0; i < message.choices.length; ++i) {
                            var error = $root.apibara.ethereum.v1alpha2.H256.verify(message.choices[i]);
                            if (error)
                                return "choices." + error;
                        }
                    }
                    return null;
                };

                /**
                 * Creates a TopicChoice message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof apibara.ethereum.v1alpha2.TopicChoice
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {apibara.ethereum.v1alpha2.TopicChoice} TopicChoice
                 */
                TopicChoice.fromObject = function fromObject(object) {
                    if (object instanceof $root.apibara.ethereum.v1alpha2.TopicChoice)
                        return object;
                    var message = new $root.apibara.ethereum.v1alpha2.TopicChoice();
                    if (object.choices) {
                        if (!Array.isArray(object.choices))
                            throw TypeError(".apibara.ethereum.v1alpha2.TopicChoice.choices: array expected");
                        message.choices = [];
                        for (var i = 0; i < object.choices.length; ++i) {
                            if (typeof object.choices[i] !== "object")
                                throw TypeError(".apibara.ethereum.v1alpha2.TopicChoice.choices: object expected");
                            message.choices[i] = $root.apibara.ethereum.v1alpha2.H256.fromObject(object.choices[i]);
                        }
                    }
                    return message;
                };

                /**
                 * Creates a plain object from a TopicChoice message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof apibara.ethereum.v1alpha2.TopicChoice
                 * @static
                 * @param {apibara.ethereum.v1alpha2.TopicChoice} message TopicChoice
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                TopicChoice.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.choices = [];
                    if (message.choices && message.choices.length) {
                        object.choices = [];
                        for (var j = 0; j < message.choices.length; ++j)
                            object.choices[j] = $root.apibara.ethereum.v1alpha2.H256.toObject(message.choices[j], options);
                    }
                    return object;
                };

                /**
                 * Converts this TopicChoice to JSON.
                 * @function toJSON
                 * @memberof apibara.ethereum.v1alpha2.TopicChoice
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                TopicChoice.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for TopicChoice
                 * @function getTypeUrl
                 * @memberof apibara.ethereum.v1alpha2.TopicChoice
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                TopicChoice.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/apibara.ethereum.v1alpha2.TopicChoice";
                };

                return TopicChoice;
            })();

            v1alpha2.H256 = (function() {

                /**
                 * Properties of a H256.
                 * @memberof apibara.ethereum.v1alpha2
                 * @interface IH256
                 * @property {number|Long|null} [loLo] H256 loLo
                 * @property {number|Long|null} [loHi] H256 loHi
                 * @property {number|Long|null} [hiLo] H256 hiLo
                 * @property {number|Long|null} [hiHi] H256 hiHi
                 */

                /**
                 * Constructs a new H256.
                 * @memberof apibara.ethereum.v1alpha2
                 * @classdesc Represents a H256.
                 * @implements IH256
                 * @constructor
                 * @param {apibara.ethereum.v1alpha2.IH256=} [properties] Properties to set
                 */
                function H256(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * H256 loLo.
                 * @member {number|Long} loLo
                 * @memberof apibara.ethereum.v1alpha2.H256
                 * @instance
                 */
                H256.prototype.loLo = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                /**
                 * H256 loHi.
                 * @member {number|Long} loHi
                 * @memberof apibara.ethereum.v1alpha2.H256
                 * @instance
                 */
                H256.prototype.loHi = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                /**
                 * H256 hiLo.
                 * @member {number|Long} hiLo
                 * @memberof apibara.ethereum.v1alpha2.H256
                 * @instance
                 */
                H256.prototype.hiLo = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                /**
                 * H256 hiHi.
                 * @member {number|Long} hiHi
                 * @memberof apibara.ethereum.v1alpha2.H256
                 * @instance
                 */
                H256.prototype.hiHi = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                /**
                 * Creates a new H256 instance using the specified properties.
                 * @function create
                 * @memberof apibara.ethereum.v1alpha2.H256
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IH256=} [properties] Properties to set
                 * @returns {apibara.ethereum.v1alpha2.H256} H256 instance
                 */
                H256.create = function create(properties) {
                    return new H256(properties);
                };

                /**
                 * Encodes the specified H256 message. Does not implicitly {@link apibara.ethereum.v1alpha2.H256.verify|verify} messages.
                 * @function encode
                 * @memberof apibara.ethereum.v1alpha2.H256
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IH256} message H256 message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                H256.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.loLo != null && Object.hasOwnProperty.call(message, "loLo"))
                        writer.uint32(/* id 1, wireType 1 =*/9).fixed64(message.loLo);
                    if (message.loHi != null && Object.hasOwnProperty.call(message, "loHi"))
                        writer.uint32(/* id 2, wireType 1 =*/17).fixed64(message.loHi);
                    if (message.hiLo != null && Object.hasOwnProperty.call(message, "hiLo"))
                        writer.uint32(/* id 3, wireType 1 =*/25).fixed64(message.hiLo);
                    if (message.hiHi != null && Object.hasOwnProperty.call(message, "hiHi"))
                        writer.uint32(/* id 4, wireType 1 =*/33).fixed64(message.hiHi);
                    return writer;
                };

                /**
                 * Encodes the specified H256 message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.H256.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.H256
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IH256} message H256 message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                H256.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a H256 message from the specified reader or buffer.
                 * @function decode
                 * @memberof apibara.ethereum.v1alpha2.H256
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {apibara.ethereum.v1alpha2.H256} H256
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                H256.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.apibara.ethereum.v1alpha2.H256();
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1: {
                                message.loLo = reader.fixed64();
                                break;
                            }
                        case 2: {
                                message.loHi = reader.fixed64();
                                break;
                            }
                        case 3: {
                                message.hiLo = reader.fixed64();
                                break;
                            }
                        case 4: {
                                message.hiHi = reader.fixed64();
                                break;
                            }
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a H256 message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.H256
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {apibara.ethereum.v1alpha2.H256} H256
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                H256.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a H256 message.
                 * @function verify
                 * @memberof apibara.ethereum.v1alpha2.H256
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                H256.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.loLo != null && message.hasOwnProperty("loLo"))
                        if (!$util.isInteger(message.loLo) && !(message.loLo && $util.isInteger(message.loLo.low) && $util.isInteger(message.loLo.high)))
                            return "loLo: integer|Long expected";
                    if (message.loHi != null && message.hasOwnProperty("loHi"))
                        if (!$util.isInteger(message.loHi) && !(message.loHi && $util.isInteger(message.loHi.low) && $util.isInteger(message.loHi.high)))
                            return "loHi: integer|Long expected";
                    if (message.hiLo != null && message.hasOwnProperty("hiLo"))
                        if (!$util.isInteger(message.hiLo) && !(message.hiLo && $util.isInteger(message.hiLo.low) && $util.isInteger(message.hiLo.high)))
                            return "hiLo: integer|Long expected";
                    if (message.hiHi != null && message.hasOwnProperty("hiHi"))
                        if (!$util.isInteger(message.hiHi) && !(message.hiHi && $util.isInteger(message.hiHi.low) && $util.isInteger(message.hiHi.high)))
                            return "hiHi: integer|Long expected";
                    return null;
                };

                /**
                 * Creates a H256 message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof apibara.ethereum.v1alpha2.H256
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {apibara.ethereum.v1alpha2.H256} H256
                 */
                H256.fromObject = function fromObject(object) {
                    if (object instanceof $root.apibara.ethereum.v1alpha2.H256)
                        return object;
                    var message = new $root.apibara.ethereum.v1alpha2.H256();
                    if (object.loLo != null)
                        if ($util.Long)
                            (message.loLo = $util.Long.fromValue(object.loLo)).unsigned = false;
                        else if (typeof object.loLo === "string")
                            message.loLo = parseInt(object.loLo, 10);
                        else if (typeof object.loLo === "number")
                            message.loLo = object.loLo;
                        else if (typeof object.loLo === "object")
                            message.loLo = new $util.LongBits(object.loLo.low >>> 0, object.loLo.high >>> 0).toNumber();
                    if (object.loHi != null)
                        if ($util.Long)
                            (message.loHi = $util.Long.fromValue(object.loHi)).unsigned = false;
                        else if (typeof object.loHi === "string")
                            message.loHi = parseInt(object.loHi, 10);
                        else if (typeof object.loHi === "number")
                            message.loHi = object.loHi;
                        else if (typeof object.loHi === "object")
                            message.loHi = new $util.LongBits(object.loHi.low >>> 0, object.loHi.high >>> 0).toNumber();
                    if (object.hiLo != null)
                        if ($util.Long)
                            (message.hiLo = $util.Long.fromValue(object.hiLo)).unsigned = false;
                        else if (typeof object.hiLo === "string")
                            message.hiLo = parseInt(object.hiLo, 10);
                        else if (typeof object.hiLo === "number")
                            message.hiLo = object.hiLo;
                        else if (typeof object.hiLo === "object")
                            message.hiLo = new $util.LongBits(object.hiLo.low >>> 0, object.hiLo.high >>> 0).toNumber();
                    if (object.hiHi != null)
                        if ($util.Long)
                            (message.hiHi = $util.Long.fromValue(object.hiHi)).unsigned = false;
                        else if (typeof object.hiHi === "string")
                            message.hiHi = parseInt(object.hiHi, 10);
                        else if (typeof object.hiHi === "number")
                            message.hiHi = object.hiHi;
                        else if (typeof object.hiHi === "object")
                            message.hiHi = new $util.LongBits(object.hiHi.low >>> 0, object.hiHi.high >>> 0).toNumber();
                    return message;
                };

                /**
                 * Creates a plain object from a H256 message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof apibara.ethereum.v1alpha2.H256
                 * @static
                 * @param {apibara.ethereum.v1alpha2.H256} message H256
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                H256.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, false);
                            object.loLo = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.loLo = options.longs === String ? "0" : 0;
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, false);
                            object.loHi = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.loHi = options.longs === String ? "0" : 0;
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, false);
                            object.hiLo = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.hiLo = options.longs === String ? "0" : 0;
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, false);
                            object.hiHi = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.hiHi = options.longs === String ? "0" : 0;
                    }
                    if (message.loLo != null && message.hasOwnProperty("loLo"))
                        if (typeof message.loLo === "number")
                            object.loLo = options.longs === String ? String(message.loLo) : message.loLo;
                        else
                            object.loLo = options.longs === String ? $util.Long.prototype.toString.call(message.loLo) : options.longs === Number ? new $util.LongBits(message.loLo.low >>> 0, message.loLo.high >>> 0).toNumber() : message.loLo;
                    if (message.loHi != null && message.hasOwnProperty("loHi"))
                        if (typeof message.loHi === "number")
                            object.loHi = options.longs === String ? String(message.loHi) : message.loHi;
                        else
                            object.loHi = options.longs === String ? $util.Long.prototype.toString.call(message.loHi) : options.longs === Number ? new $util.LongBits(message.loHi.low >>> 0, message.loHi.high >>> 0).toNumber() : message.loHi;
                    if (message.hiLo != null && message.hasOwnProperty("hiLo"))
                        if (typeof message.hiLo === "number")
                            object.hiLo = options.longs === String ? String(message.hiLo) : message.hiLo;
                        else
                            object.hiLo = options.longs === String ? $util.Long.prototype.toString.call(message.hiLo) : options.longs === Number ? new $util.LongBits(message.hiLo.low >>> 0, message.hiLo.high >>> 0).toNumber() : message.hiLo;
                    if (message.hiHi != null && message.hasOwnProperty("hiHi"))
                        if (typeof message.hiHi === "number")
                            object.hiHi = options.longs === String ? String(message.hiHi) : message.hiHi;
                        else
                            object.hiHi = options.longs === String ? $util.Long.prototype.toString.call(message.hiHi) : options.longs === Number ? new $util.LongBits(message.hiHi.low >>> 0, message.hiHi.high >>> 0).toNumber() : message.hiHi;
                    return object;
                };

                /**
                 * Converts this H256 to JSON.
                 * @function toJSON
                 * @memberof apibara.ethereum.v1alpha2.H256
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                H256.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for H256
                 * @function getTypeUrl
                 * @memberof apibara.ethereum.v1alpha2.H256
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                H256.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/apibara.ethereum.v1alpha2.H256";
                };

                return H256;
            })();

            v1alpha2.H160 = (function() {

                /**
                 * Properties of a H160.
                 * @memberof apibara.ethereum.v1alpha2
                 * @interface IH160
                 * @property {number|Long|null} [loLo] H160 loLo
                 * @property {number|Long|null} [loHi] H160 loHi
                 * @property {number|null} [hi] H160 hi
                 */

                /**
                 * Constructs a new H160.
                 * @memberof apibara.ethereum.v1alpha2
                 * @classdesc Represents a H160.
                 * @implements IH160
                 * @constructor
                 * @param {apibara.ethereum.v1alpha2.IH160=} [properties] Properties to set
                 */
                function H160(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * H160 loLo.
                 * @member {number|Long} loLo
                 * @memberof apibara.ethereum.v1alpha2.H160
                 * @instance
                 */
                H160.prototype.loLo = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                /**
                 * H160 loHi.
                 * @member {number|Long} loHi
                 * @memberof apibara.ethereum.v1alpha2.H160
                 * @instance
                 */
                H160.prototype.loHi = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                /**
                 * H160 hi.
                 * @member {number} hi
                 * @memberof apibara.ethereum.v1alpha2.H160
                 * @instance
                 */
                H160.prototype.hi = 0;

                /**
                 * Creates a new H160 instance using the specified properties.
                 * @function create
                 * @memberof apibara.ethereum.v1alpha2.H160
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IH160=} [properties] Properties to set
                 * @returns {apibara.ethereum.v1alpha2.H160} H160 instance
                 */
                H160.create = function create(properties) {
                    return new H160(properties);
                };

                /**
                 * Encodes the specified H160 message. Does not implicitly {@link apibara.ethereum.v1alpha2.H160.verify|verify} messages.
                 * @function encode
                 * @memberof apibara.ethereum.v1alpha2.H160
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IH160} message H160 message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                H160.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.loLo != null && Object.hasOwnProperty.call(message, "loLo"))
                        writer.uint32(/* id 1, wireType 1 =*/9).fixed64(message.loLo);
                    if (message.loHi != null && Object.hasOwnProperty.call(message, "loHi"))
                        writer.uint32(/* id 2, wireType 1 =*/17).fixed64(message.loHi);
                    if (message.hi != null && Object.hasOwnProperty.call(message, "hi"))
                        writer.uint32(/* id 3, wireType 5 =*/29).fixed32(message.hi);
                    return writer;
                };

                /**
                 * Encodes the specified H160 message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.H160.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.H160
                 * @static
                 * @param {apibara.ethereum.v1alpha2.IH160} message H160 message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                H160.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a H160 message from the specified reader or buffer.
                 * @function decode
                 * @memberof apibara.ethereum.v1alpha2.H160
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {apibara.ethereum.v1alpha2.H160} H160
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                H160.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.apibara.ethereum.v1alpha2.H160();
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1: {
                                message.loLo = reader.fixed64();
                                break;
                            }
                        case 2: {
                                message.loHi = reader.fixed64();
                                break;
                            }
                        case 3: {
                                message.hi = reader.fixed32();
                                break;
                            }
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a H160 message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof apibara.ethereum.v1alpha2.H160
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {apibara.ethereum.v1alpha2.H160} H160
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                H160.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a H160 message.
                 * @function verify
                 * @memberof apibara.ethereum.v1alpha2.H160
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                H160.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.loLo != null && message.hasOwnProperty("loLo"))
                        if (!$util.isInteger(message.loLo) && !(message.loLo && $util.isInteger(message.loLo.low) && $util.isInteger(message.loLo.high)))
                            return "loLo: integer|Long expected";
                    if (message.loHi != null && message.hasOwnProperty("loHi"))
                        if (!$util.isInteger(message.loHi) && !(message.loHi && $util.isInteger(message.loHi.low) && $util.isInteger(message.loHi.high)))
                            return "loHi: integer|Long expected";
                    if (message.hi != null && message.hasOwnProperty("hi"))
                        if (!$util.isInteger(message.hi))
                            return "hi: integer expected";
                    return null;
                };

                /**
                 * Creates a H160 message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof apibara.ethereum.v1alpha2.H160
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {apibara.ethereum.v1alpha2.H160} H160
                 */
                H160.fromObject = function fromObject(object) {
                    if (object instanceof $root.apibara.ethereum.v1alpha2.H160)
                        return object;
                    var message = new $root.apibara.ethereum.v1alpha2.H160();
                    if (object.loLo != null)
                        if ($util.Long)
                            (message.loLo = $util.Long.fromValue(object.loLo)).unsigned = false;
                        else if (typeof object.loLo === "string")
                            message.loLo = parseInt(object.loLo, 10);
                        else if (typeof object.loLo === "number")
                            message.loLo = object.loLo;
                        else if (typeof object.loLo === "object")
                            message.loLo = new $util.LongBits(object.loLo.low >>> 0, object.loLo.high >>> 0).toNumber();
                    if (object.loHi != null)
                        if ($util.Long)
                            (message.loHi = $util.Long.fromValue(object.loHi)).unsigned = false;
                        else if (typeof object.loHi === "string")
                            message.loHi = parseInt(object.loHi, 10);
                        else if (typeof object.loHi === "number")
                            message.loHi = object.loHi;
                        else if (typeof object.loHi === "object")
                            message.loHi = new $util.LongBits(object.loHi.low >>> 0, object.loHi.high >>> 0).toNumber();
                    if (object.hi != null)
                        message.hi = object.hi >>> 0;
                    return message;
                };

                /**
                 * Creates a plain object from a H160 message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof apibara.ethereum.v1alpha2.H160
                 * @static
                 * @param {apibara.ethereum.v1alpha2.H160} message H160
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                H160.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, false);
                            object.loLo = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.loLo = options.longs === String ? "0" : 0;
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, false);
                            object.loHi = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.loHi = options.longs === String ? "0" : 0;
                        object.hi = 0;
                    }
                    if (message.loLo != null && message.hasOwnProperty("loLo"))
                        if (typeof message.loLo === "number")
                            object.loLo = options.longs === String ? String(message.loLo) : message.loLo;
                        else
                            object.loLo = options.longs === String ? $util.Long.prototype.toString.call(message.loLo) : options.longs === Number ? new $util.LongBits(message.loLo.low >>> 0, message.loLo.high >>> 0).toNumber() : message.loLo;
                    if (message.loHi != null && message.hasOwnProperty("loHi"))
                        if (typeof message.loHi === "number")
                            object.loHi = options.longs === String ? String(message.loHi) : message.loHi;
                        else
                            object.loHi = options.longs === String ? $util.Long.prototype.toString.call(message.loHi) : options.longs === Number ? new $util.LongBits(message.loHi.low >>> 0, message.loHi.high >>> 0).toNumber() : message.loHi;
                    if (message.hi != null && message.hasOwnProperty("hi"))
                        object.hi = message.hi;
                    return object;
                };

                /**
                 * Converts this H160 to JSON.
                 * @function toJSON
                 * @memberof apibara.ethereum.v1alpha2.H160
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                H160.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for H160
                 * @function getTypeUrl
                 * @memberof apibara.ethereum.v1alpha2.H160
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                H160.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/apibara.ethereum.v1alpha2.H160";
                };

                return H160;
            })();

            return v1alpha2;
        })();

        return ethereum;
    })();

    return apibara;
})();

$root.google = (function() {

    /**
     * Namespace google.
     * @exports google
     * @namespace
     */
    var google = {};

    google.protobuf = (function() {

        /**
         * Namespace protobuf.
         * @memberof google
         * @namespace
         */
        var protobuf = {};

        protobuf.Timestamp = (function() {

            /**
             * Properties of a Timestamp.
             * @memberof google.protobuf
             * @interface ITimestamp
             * @property {number|Long|null} [seconds] Timestamp seconds
             * @property {number|null} [nanos] Timestamp nanos
             */

            /**
             * Constructs a new Timestamp.
             * @memberof google.protobuf
             * @classdesc Represents a Timestamp.
             * @implements ITimestamp
             * @constructor
             * @param {google.protobuf.ITimestamp=} [properties] Properties to set
             */
            function Timestamp(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Timestamp seconds.
             * @member {number|Long} seconds
             * @memberof google.protobuf.Timestamp
             * @instance
             */
            Timestamp.prototype.seconds = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * Timestamp nanos.
             * @member {number} nanos
             * @memberof google.protobuf.Timestamp
             * @instance
             */
            Timestamp.prototype.nanos = 0;

            /**
             * Creates a new Timestamp instance using the specified properties.
             * @function create
             * @memberof google.protobuf.Timestamp
             * @static
             * @param {google.protobuf.ITimestamp=} [properties] Properties to set
             * @returns {google.protobuf.Timestamp} Timestamp instance
             */
            Timestamp.create = function create(properties) {
                return new Timestamp(properties);
            };

            /**
             * Encodes the specified Timestamp message. Does not implicitly {@link google.protobuf.Timestamp.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.Timestamp
             * @static
             * @param {google.protobuf.ITimestamp} message Timestamp message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Timestamp.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.seconds != null && Object.hasOwnProperty.call(message, "seconds"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int64(message.seconds);
                if (message.nanos != null && Object.hasOwnProperty.call(message, "nanos"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.nanos);
                return writer;
            };

            /**
             * Encodes the specified Timestamp message, length delimited. Does not implicitly {@link google.protobuf.Timestamp.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.Timestamp
             * @static
             * @param {google.protobuf.ITimestamp} message Timestamp message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Timestamp.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Timestamp message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.Timestamp
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.Timestamp} Timestamp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Timestamp.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.Timestamp();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1: {
                            message.seconds = reader.int64();
                            break;
                        }
                    case 2: {
                            message.nanos = reader.int32();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Timestamp message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.Timestamp
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.Timestamp} Timestamp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Timestamp.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Timestamp message.
             * @function verify
             * @memberof google.protobuf.Timestamp
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Timestamp.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.seconds != null && message.hasOwnProperty("seconds"))
                    if (!$util.isInteger(message.seconds) && !(message.seconds && $util.isInteger(message.seconds.low) && $util.isInteger(message.seconds.high)))
                        return "seconds: integer|Long expected";
                if (message.nanos != null && message.hasOwnProperty("nanos"))
                    if (!$util.isInteger(message.nanos))
                        return "nanos: integer expected";
                return null;
            };

            /**
             * Creates a Timestamp message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.Timestamp
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.Timestamp} Timestamp
             */
            Timestamp.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.Timestamp)
                    return object;
                var message = new $root.google.protobuf.Timestamp();
                if (object.seconds != null)
                    if ($util.Long)
                        (message.seconds = $util.Long.fromValue(object.seconds)).unsigned = false;
                    else if (typeof object.seconds === "string")
                        message.seconds = parseInt(object.seconds, 10);
                    else if (typeof object.seconds === "number")
                        message.seconds = object.seconds;
                    else if (typeof object.seconds === "object")
                        message.seconds = new $util.LongBits(object.seconds.low >>> 0, object.seconds.high >>> 0).toNumber();
                if (object.nanos != null)
                    message.nanos = object.nanos | 0;
                return message;
            };

            /**
             * Creates a plain object from a Timestamp message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.Timestamp
             * @static
             * @param {google.protobuf.Timestamp} message Timestamp
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Timestamp.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, false);
                        object.seconds = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.seconds = options.longs === String ? "0" : 0;
                    object.nanos = 0;
                }
                if (message.seconds != null && message.hasOwnProperty("seconds"))
                    if (typeof message.seconds === "number")
                        object.seconds = options.longs === String ? String(message.seconds) : message.seconds;
                    else
                        object.seconds = options.longs === String ? $util.Long.prototype.toString.call(message.seconds) : options.longs === Number ? new $util.LongBits(message.seconds.low >>> 0, message.seconds.high >>> 0).toNumber() : message.seconds;
                if (message.nanos != null && message.hasOwnProperty("nanos"))
                    object.nanos = message.nanos;
                return object;
            };

            /**
             * Converts this Timestamp to JSON.
             * @function toJSON
             * @memberof google.protobuf.Timestamp
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Timestamp.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Timestamp
             * @function getTypeUrl
             * @memberof google.protobuf.Timestamp
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Timestamp.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.Timestamp";
            };

            return Timestamp;
        })();

        return protobuf;
    })();

    return google;
})();

module.exports = $root;
