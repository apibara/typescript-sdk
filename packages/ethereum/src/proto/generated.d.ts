import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace apibara. */
export namespace apibara {

    /** Namespace ethereum. */
    namespace ethereum {

        /** Namespace v1alpha2. */
        namespace v1alpha2 {

            /** Properties of a Block. */
            interface IBlock {

                /** Block status */
                status?: (apibara.ethereum.v1alpha2.BlockStatus|null);

                /** Block header */
                header?: (apibara.ethereum.v1alpha2.IBlockHeader|null);

                /** Block logs */
                logs?: (apibara.ethereum.v1alpha2.ILogWithTransaction[]|null);
            }

            /** Represents a Block. */
            class Block implements IBlock {

                /**
                 * Constructs a new Block.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: apibara.ethereum.v1alpha2.IBlock);

                /** Block status. */
                public status: apibara.ethereum.v1alpha2.BlockStatus;

                /** Block header. */
                public header?: (apibara.ethereum.v1alpha2.IBlockHeader|null);

                /** Block logs. */
                public logs: apibara.ethereum.v1alpha2.ILogWithTransaction[];

                /**
                 * Creates a new Block instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Block instance
                 */
                public static create(properties?: apibara.ethereum.v1alpha2.IBlock): apibara.ethereum.v1alpha2.Block;

                /**
                 * Encodes the specified Block message. Does not implicitly {@link apibara.ethereum.v1alpha2.Block.verify|verify} messages.
                 * @param message Block message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: apibara.ethereum.v1alpha2.IBlock, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Block message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.Block.verify|verify} messages.
                 * @param message Block message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: apibara.ethereum.v1alpha2.IBlock, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Block message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Block
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): apibara.ethereum.v1alpha2.Block;

                /**
                 * Decodes a Block message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Block
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): apibara.ethereum.v1alpha2.Block;

                /**
                 * Verifies a Block message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Block message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Block
                 */
                public static fromObject(object: { [k: string]: any }): apibara.ethereum.v1alpha2.Block;

                /**
                 * Creates a plain object from a Block message. Also converts values to other types if specified.
                 * @param message Block
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: apibara.ethereum.v1alpha2.Block, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Block to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for Block
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a BlockHeader. */
            interface IBlockHeader {

                /** BlockHeader blockHash */
                blockHash?: (apibara.ethereum.v1alpha2.IH256|null);

                /** BlockHeader parentBlockHash */
                parentBlockHash?: (apibara.ethereum.v1alpha2.IH256|null);

                /** BlockHeader ommersHash */
                ommersHash?: (apibara.ethereum.v1alpha2.IH256|null);

                /** BlockHeader beneficiary */
                beneficiary?: (apibara.ethereum.v1alpha2.IH160|null);

                /** BlockHeader stateRoot */
                stateRoot?: (apibara.ethereum.v1alpha2.IH256|null);

                /** BlockHeader transactionsRoot */
                transactionsRoot?: (apibara.ethereum.v1alpha2.IH256|null);

                /** BlockHeader receiptsRoot */
                receiptsRoot?: (apibara.ethereum.v1alpha2.IH256|null);

                /** BlockHeader withdrawalsRoot */
                withdrawalsRoot?: (apibara.ethereum.v1alpha2.IH256|null);

                /** BlockHeader logsBloom */
                logsBloom?: (Uint8Array|null);

                /** BlockHeader difficulty */
                difficulty?: (number|Long|null);

                /** BlockHeader blockNumber */
                blockNumber?: (number|Long|null);

                /** BlockHeader gasLimit */
                gasLimit?: (number|Long|null);

                /** BlockHeader gasUsed */
                gasUsed?: (number|Long|null);

                /** BlockHeader timestamp */
                timestamp?: (google.protobuf.ITimestamp|null);

                /** BlockHeader mixHash */
                mixHash?: (apibara.ethereum.v1alpha2.IH256|null);

                /** BlockHeader nonce */
                nonce?: (number|Long|null);

                /** BlockHeader baseFeePerGas */
                baseFeePerGas?: (number|Long|null);

                /** BlockHeader extraData */
                extraData?: (Uint8Array|null);
            }

            /** Represents a BlockHeader. */
            class BlockHeader implements IBlockHeader {

                /**
                 * Constructs a new BlockHeader.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: apibara.ethereum.v1alpha2.IBlockHeader);

                /** BlockHeader blockHash. */
                public blockHash?: (apibara.ethereum.v1alpha2.IH256|null);

                /** BlockHeader parentBlockHash. */
                public parentBlockHash?: (apibara.ethereum.v1alpha2.IH256|null);

                /** BlockHeader ommersHash. */
                public ommersHash?: (apibara.ethereum.v1alpha2.IH256|null);

                /** BlockHeader beneficiary. */
                public beneficiary?: (apibara.ethereum.v1alpha2.IH160|null);

                /** BlockHeader stateRoot. */
                public stateRoot?: (apibara.ethereum.v1alpha2.IH256|null);

                /** BlockHeader transactionsRoot. */
                public transactionsRoot?: (apibara.ethereum.v1alpha2.IH256|null);

                /** BlockHeader receiptsRoot. */
                public receiptsRoot?: (apibara.ethereum.v1alpha2.IH256|null);

                /** BlockHeader withdrawalsRoot. */
                public withdrawalsRoot?: (apibara.ethereum.v1alpha2.IH256|null);

                /** BlockHeader logsBloom. */
                public logsBloom: Uint8Array;

                /** BlockHeader difficulty. */
                public difficulty: (number|Long);

                /** BlockHeader blockNumber. */
                public blockNumber: (number|Long);

                /** BlockHeader gasLimit. */
                public gasLimit: (number|Long);

                /** BlockHeader gasUsed. */
                public gasUsed: (number|Long);

                /** BlockHeader timestamp. */
                public timestamp?: (google.protobuf.ITimestamp|null);

                /** BlockHeader mixHash. */
                public mixHash?: (apibara.ethereum.v1alpha2.IH256|null);

                /** BlockHeader nonce. */
                public nonce: (number|Long);

                /** BlockHeader baseFeePerGas. */
                public baseFeePerGas: (number|Long);

                /** BlockHeader extraData. */
                public extraData: Uint8Array;

                /**
                 * Creates a new BlockHeader instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns BlockHeader instance
                 */
                public static create(properties?: apibara.ethereum.v1alpha2.IBlockHeader): apibara.ethereum.v1alpha2.BlockHeader;

                /**
                 * Encodes the specified BlockHeader message. Does not implicitly {@link apibara.ethereum.v1alpha2.BlockHeader.verify|verify} messages.
                 * @param message BlockHeader message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: apibara.ethereum.v1alpha2.IBlockHeader, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified BlockHeader message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.BlockHeader.verify|verify} messages.
                 * @param message BlockHeader message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: apibara.ethereum.v1alpha2.IBlockHeader, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a BlockHeader message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns BlockHeader
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): apibara.ethereum.v1alpha2.BlockHeader;

                /**
                 * Decodes a BlockHeader message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns BlockHeader
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): apibara.ethereum.v1alpha2.BlockHeader;

                /**
                 * Verifies a BlockHeader message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a BlockHeader message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns BlockHeader
                 */
                public static fromObject(object: { [k: string]: any }): apibara.ethereum.v1alpha2.BlockHeader;

                /**
                 * Creates a plain object from a BlockHeader message. Also converts values to other types if specified.
                 * @param message BlockHeader
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: apibara.ethereum.v1alpha2.BlockHeader, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this BlockHeader to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for BlockHeader
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** BlockStatus enum. */
            enum BlockStatus {
                BLOCK_STATUS_UNSPECIFIED = 0,
                BLOCK_STATUS_PENDING = 1,
                BLOCK_STATUS_ACCEPTED = 2,
                BLOCK_STATUS_SAFE = 3,
                BLOCK_STATUS_FINALIZED = 4,
                BLOCK_STATUS_REJECTED = 5
            }

            /** Properties of a LogWithTransaction. */
            interface ILogWithTransaction {

                /** LogWithTransaction transaction */
                transaction?: (apibara.ethereum.v1alpha2.ITransaction|null);

                /** LogWithTransaction receipt */
                receipt?: (apibara.ethereum.v1alpha2.IReceipt|null);

                /** LogWithTransaction log */
                log?: (apibara.ethereum.v1alpha2.ILog|null);
            }

            /** Represents a LogWithTransaction. */
            class LogWithTransaction implements ILogWithTransaction {

                /**
                 * Constructs a new LogWithTransaction.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: apibara.ethereum.v1alpha2.ILogWithTransaction);

                /** LogWithTransaction transaction. */
                public transaction?: (apibara.ethereum.v1alpha2.ITransaction|null);

                /** LogWithTransaction receipt. */
                public receipt?: (apibara.ethereum.v1alpha2.IReceipt|null);

                /** LogWithTransaction log. */
                public log?: (apibara.ethereum.v1alpha2.ILog|null);

                /**
                 * Creates a new LogWithTransaction instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns LogWithTransaction instance
                 */
                public static create(properties?: apibara.ethereum.v1alpha2.ILogWithTransaction): apibara.ethereum.v1alpha2.LogWithTransaction;

                /**
                 * Encodes the specified LogWithTransaction message. Does not implicitly {@link apibara.ethereum.v1alpha2.LogWithTransaction.verify|verify} messages.
                 * @param message LogWithTransaction message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: apibara.ethereum.v1alpha2.ILogWithTransaction, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified LogWithTransaction message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.LogWithTransaction.verify|verify} messages.
                 * @param message LogWithTransaction message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: apibara.ethereum.v1alpha2.ILogWithTransaction, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a LogWithTransaction message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns LogWithTransaction
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): apibara.ethereum.v1alpha2.LogWithTransaction;

                /**
                 * Decodes a LogWithTransaction message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns LogWithTransaction
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): apibara.ethereum.v1alpha2.LogWithTransaction;

                /**
                 * Verifies a LogWithTransaction message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a LogWithTransaction message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns LogWithTransaction
                 */
                public static fromObject(object: { [k: string]: any }): apibara.ethereum.v1alpha2.LogWithTransaction;

                /**
                 * Creates a plain object from a LogWithTransaction message. Also converts values to other types if specified.
                 * @param message LogWithTransaction
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: apibara.ethereum.v1alpha2.LogWithTransaction, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this LogWithTransaction to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for LogWithTransaction
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a Transaction. */
            interface ITransaction {
            }

            /** Represents a Transaction. */
            class Transaction implements ITransaction {

                /**
                 * Constructs a new Transaction.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: apibara.ethereum.v1alpha2.ITransaction);

                /**
                 * Creates a new Transaction instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Transaction instance
                 */
                public static create(properties?: apibara.ethereum.v1alpha2.ITransaction): apibara.ethereum.v1alpha2.Transaction;

                /**
                 * Encodes the specified Transaction message. Does not implicitly {@link apibara.ethereum.v1alpha2.Transaction.verify|verify} messages.
                 * @param message Transaction message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: apibara.ethereum.v1alpha2.ITransaction, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Transaction message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.Transaction.verify|verify} messages.
                 * @param message Transaction message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: apibara.ethereum.v1alpha2.ITransaction, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Transaction message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Transaction
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): apibara.ethereum.v1alpha2.Transaction;

                /**
                 * Decodes a Transaction message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Transaction
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): apibara.ethereum.v1alpha2.Transaction;

                /**
                 * Verifies a Transaction message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Transaction message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Transaction
                 */
                public static fromObject(object: { [k: string]: any }): apibara.ethereum.v1alpha2.Transaction;

                /**
                 * Creates a plain object from a Transaction message. Also converts values to other types if specified.
                 * @param message Transaction
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: apibara.ethereum.v1alpha2.Transaction, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Transaction to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for Transaction
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a Receipt. */
            interface IReceipt {
            }

            /** Represents a Receipt. */
            class Receipt implements IReceipt {

                /**
                 * Constructs a new Receipt.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: apibara.ethereum.v1alpha2.IReceipt);

                /**
                 * Creates a new Receipt instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Receipt instance
                 */
                public static create(properties?: apibara.ethereum.v1alpha2.IReceipt): apibara.ethereum.v1alpha2.Receipt;

                /**
                 * Encodes the specified Receipt message. Does not implicitly {@link apibara.ethereum.v1alpha2.Receipt.verify|verify} messages.
                 * @param message Receipt message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: apibara.ethereum.v1alpha2.IReceipt, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Receipt message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.Receipt.verify|verify} messages.
                 * @param message Receipt message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: apibara.ethereum.v1alpha2.IReceipt, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Receipt message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Receipt
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): apibara.ethereum.v1alpha2.Receipt;

                /**
                 * Decodes a Receipt message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Receipt
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): apibara.ethereum.v1alpha2.Receipt;

                /**
                 * Verifies a Receipt message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Receipt message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Receipt
                 */
                public static fromObject(object: { [k: string]: any }): apibara.ethereum.v1alpha2.Receipt;

                /**
                 * Creates a plain object from a Receipt message. Also converts values to other types if specified.
                 * @param message Receipt
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: apibara.ethereum.v1alpha2.Receipt, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Receipt to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for Receipt
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a Log. */
            interface ILog {

                /** Log address */
                address?: (apibara.ethereum.v1alpha2.IH160|null);

                /** Log topics */
                topics?: (apibara.ethereum.v1alpha2.IH256[]|null);

                /** Log data */
                data?: (Uint8Array|null);
            }

            /** Represents a Log. */
            class Log implements ILog {

                /**
                 * Constructs a new Log.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: apibara.ethereum.v1alpha2.ILog);

                /** Log address. */
                public address?: (apibara.ethereum.v1alpha2.IH160|null);

                /** Log topics. */
                public topics: apibara.ethereum.v1alpha2.IH256[];

                /** Log data. */
                public data: Uint8Array;

                /**
                 * Creates a new Log instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Log instance
                 */
                public static create(properties?: apibara.ethereum.v1alpha2.ILog): apibara.ethereum.v1alpha2.Log;

                /**
                 * Encodes the specified Log message. Does not implicitly {@link apibara.ethereum.v1alpha2.Log.verify|verify} messages.
                 * @param message Log message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: apibara.ethereum.v1alpha2.ILog, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Log message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.Log.verify|verify} messages.
                 * @param message Log message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: apibara.ethereum.v1alpha2.ILog, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Log message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Log
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): apibara.ethereum.v1alpha2.Log;

                /**
                 * Decodes a Log message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Log
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): apibara.ethereum.v1alpha2.Log;

                /**
                 * Verifies a Log message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Log message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Log
                 */
                public static fromObject(object: { [k: string]: any }): apibara.ethereum.v1alpha2.Log;

                /**
                 * Creates a plain object from a Log message. Also converts values to other types if specified.
                 * @param message Log
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: apibara.ethereum.v1alpha2.Log, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Log to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for Log
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a Filter. */
            interface IFilter {

                /** Filter header */
                header?: (apibara.ethereum.v1alpha2.IHeaderFilter|null);

                /** Filter logs */
                logs?: (apibara.ethereum.v1alpha2.ILogFilter[]|null);
            }

            /** Represents a Filter. */
            class Filter implements IFilter {

                /**
                 * Constructs a new Filter.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: apibara.ethereum.v1alpha2.IFilter);

                /** Filter header. */
                public header?: (apibara.ethereum.v1alpha2.IHeaderFilter|null);

                /** Filter logs. */
                public logs: apibara.ethereum.v1alpha2.ILogFilter[];

                /**
                 * Creates a new Filter instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Filter instance
                 */
                public static create(properties?: apibara.ethereum.v1alpha2.IFilter): apibara.ethereum.v1alpha2.Filter;

                /**
                 * Encodes the specified Filter message. Does not implicitly {@link apibara.ethereum.v1alpha2.Filter.verify|verify} messages.
                 * @param message Filter message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: apibara.ethereum.v1alpha2.IFilter, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Filter message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.Filter.verify|verify} messages.
                 * @param message Filter message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: apibara.ethereum.v1alpha2.IFilter, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Filter message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Filter
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): apibara.ethereum.v1alpha2.Filter;

                /**
                 * Decodes a Filter message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Filter
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): apibara.ethereum.v1alpha2.Filter;

                /**
                 * Verifies a Filter message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Filter message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Filter
                 */
                public static fromObject(object: { [k: string]: any }): apibara.ethereum.v1alpha2.Filter;

                /**
                 * Creates a plain object from a Filter message. Also converts values to other types if specified.
                 * @param message Filter
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: apibara.ethereum.v1alpha2.Filter, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Filter to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for Filter
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a HeaderFilter. */
            interface IHeaderFilter {

                /** HeaderFilter weak */
                weak?: (boolean|null);

                /** HeaderFilter rlp */
                rlp?: (boolean|null);
            }

            /** Represents a HeaderFilter. */
            class HeaderFilter implements IHeaderFilter {

                /**
                 * Constructs a new HeaderFilter.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: apibara.ethereum.v1alpha2.IHeaderFilter);

                /** HeaderFilter weak. */
                public weak: boolean;

                /** HeaderFilter rlp. */
                public rlp: boolean;

                /**
                 * Creates a new HeaderFilter instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns HeaderFilter instance
                 */
                public static create(properties?: apibara.ethereum.v1alpha2.IHeaderFilter): apibara.ethereum.v1alpha2.HeaderFilter;

                /**
                 * Encodes the specified HeaderFilter message. Does not implicitly {@link apibara.ethereum.v1alpha2.HeaderFilter.verify|verify} messages.
                 * @param message HeaderFilter message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: apibara.ethereum.v1alpha2.IHeaderFilter, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified HeaderFilter message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.HeaderFilter.verify|verify} messages.
                 * @param message HeaderFilter message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: apibara.ethereum.v1alpha2.IHeaderFilter, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a HeaderFilter message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns HeaderFilter
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): apibara.ethereum.v1alpha2.HeaderFilter;

                /**
                 * Decodes a HeaderFilter message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns HeaderFilter
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): apibara.ethereum.v1alpha2.HeaderFilter;

                /**
                 * Verifies a HeaderFilter message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a HeaderFilter message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns HeaderFilter
                 */
                public static fromObject(object: { [k: string]: any }): apibara.ethereum.v1alpha2.HeaderFilter;

                /**
                 * Creates a plain object from a HeaderFilter message. Also converts values to other types if specified.
                 * @param message HeaderFilter
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: apibara.ethereum.v1alpha2.HeaderFilter, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this HeaderFilter to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for HeaderFilter
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a LogFilter. */
            interface ILogFilter {

                /** LogFilter address */
                address?: (apibara.ethereum.v1alpha2.IH160|null);

                /** LogFilter topics */
                topics?: (apibara.ethereum.v1alpha2.ITopicChoice[]|null);
            }

            /** Represents a LogFilter. */
            class LogFilter implements ILogFilter {

                /**
                 * Constructs a new LogFilter.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: apibara.ethereum.v1alpha2.ILogFilter);

                /** LogFilter address. */
                public address?: (apibara.ethereum.v1alpha2.IH160|null);

                /** LogFilter topics. */
                public topics: apibara.ethereum.v1alpha2.ITopicChoice[];

                /**
                 * Creates a new LogFilter instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns LogFilter instance
                 */
                public static create(properties?: apibara.ethereum.v1alpha2.ILogFilter): apibara.ethereum.v1alpha2.LogFilter;

                /**
                 * Encodes the specified LogFilter message. Does not implicitly {@link apibara.ethereum.v1alpha2.LogFilter.verify|verify} messages.
                 * @param message LogFilter message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: apibara.ethereum.v1alpha2.ILogFilter, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified LogFilter message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.LogFilter.verify|verify} messages.
                 * @param message LogFilter message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: apibara.ethereum.v1alpha2.ILogFilter, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a LogFilter message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns LogFilter
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): apibara.ethereum.v1alpha2.LogFilter;

                /**
                 * Decodes a LogFilter message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns LogFilter
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): apibara.ethereum.v1alpha2.LogFilter;

                /**
                 * Verifies a LogFilter message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a LogFilter message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns LogFilter
                 */
                public static fromObject(object: { [k: string]: any }): apibara.ethereum.v1alpha2.LogFilter;

                /**
                 * Creates a plain object from a LogFilter message. Also converts values to other types if specified.
                 * @param message LogFilter
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: apibara.ethereum.v1alpha2.LogFilter, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this LogFilter to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for LogFilter
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a TopicChoice. */
            interface ITopicChoice {

                /** TopicChoice choices */
                choices?: (apibara.ethereum.v1alpha2.IH256[]|null);
            }

            /** Represents a TopicChoice. */
            class TopicChoice implements ITopicChoice {

                /**
                 * Constructs a new TopicChoice.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: apibara.ethereum.v1alpha2.ITopicChoice);

                /** TopicChoice choices. */
                public choices: apibara.ethereum.v1alpha2.IH256[];

                /**
                 * Creates a new TopicChoice instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns TopicChoice instance
                 */
                public static create(properties?: apibara.ethereum.v1alpha2.ITopicChoice): apibara.ethereum.v1alpha2.TopicChoice;

                /**
                 * Encodes the specified TopicChoice message. Does not implicitly {@link apibara.ethereum.v1alpha2.TopicChoice.verify|verify} messages.
                 * @param message TopicChoice message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: apibara.ethereum.v1alpha2.ITopicChoice, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified TopicChoice message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.TopicChoice.verify|verify} messages.
                 * @param message TopicChoice message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: apibara.ethereum.v1alpha2.ITopicChoice, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a TopicChoice message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns TopicChoice
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): apibara.ethereum.v1alpha2.TopicChoice;

                /**
                 * Decodes a TopicChoice message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns TopicChoice
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): apibara.ethereum.v1alpha2.TopicChoice;

                /**
                 * Verifies a TopicChoice message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a TopicChoice message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns TopicChoice
                 */
                public static fromObject(object: { [k: string]: any }): apibara.ethereum.v1alpha2.TopicChoice;

                /**
                 * Creates a plain object from a TopicChoice message. Also converts values to other types if specified.
                 * @param message TopicChoice
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: apibara.ethereum.v1alpha2.TopicChoice, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this TopicChoice to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for TopicChoice
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a H256. */
            interface IH256 {

                /** H256 loLo */
                loLo?: (number|Long|null);

                /** H256 loHi */
                loHi?: (number|Long|null);

                /** H256 hiLo */
                hiLo?: (number|Long|null);

                /** H256 hiHi */
                hiHi?: (number|Long|null);
            }

            /** Represents a H256. */
            class H256 implements IH256 {

                /**
                 * Constructs a new H256.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: apibara.ethereum.v1alpha2.IH256);

                /** H256 loLo. */
                public loLo: (number|Long);

                /** H256 loHi. */
                public loHi: (number|Long);

                /** H256 hiLo. */
                public hiLo: (number|Long);

                /** H256 hiHi. */
                public hiHi: (number|Long);

                /**
                 * Creates a new H256 instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns H256 instance
                 */
                public static create(properties?: apibara.ethereum.v1alpha2.IH256): apibara.ethereum.v1alpha2.H256;

                /**
                 * Encodes the specified H256 message. Does not implicitly {@link apibara.ethereum.v1alpha2.H256.verify|verify} messages.
                 * @param message H256 message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: apibara.ethereum.v1alpha2.IH256, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified H256 message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.H256.verify|verify} messages.
                 * @param message H256 message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: apibara.ethereum.v1alpha2.IH256, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a H256 message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns H256
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): apibara.ethereum.v1alpha2.H256;

                /**
                 * Decodes a H256 message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns H256
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): apibara.ethereum.v1alpha2.H256;

                /**
                 * Verifies a H256 message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a H256 message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns H256
                 */
                public static fromObject(object: { [k: string]: any }): apibara.ethereum.v1alpha2.H256;

                /**
                 * Creates a plain object from a H256 message. Also converts values to other types if specified.
                 * @param message H256
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: apibara.ethereum.v1alpha2.H256, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this H256 to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for H256
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a H160. */
            interface IH160 {

                /** H160 loLo */
                loLo?: (number|Long|null);

                /** H160 loHi */
                loHi?: (number|Long|null);

                /** H160 hi */
                hi?: (number|null);
            }

            /** Represents a H160. */
            class H160 implements IH160 {

                /**
                 * Constructs a new H160.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: apibara.ethereum.v1alpha2.IH160);

                /** H160 loLo. */
                public loLo: (number|Long);

                /** H160 loHi. */
                public loHi: (number|Long);

                /** H160 hi. */
                public hi: number;

                /**
                 * Creates a new H160 instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns H160 instance
                 */
                public static create(properties?: apibara.ethereum.v1alpha2.IH160): apibara.ethereum.v1alpha2.H160;

                /**
                 * Encodes the specified H160 message. Does not implicitly {@link apibara.ethereum.v1alpha2.H160.verify|verify} messages.
                 * @param message H160 message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: apibara.ethereum.v1alpha2.IH160, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified H160 message, length delimited. Does not implicitly {@link apibara.ethereum.v1alpha2.H160.verify|verify} messages.
                 * @param message H160 message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: apibara.ethereum.v1alpha2.IH160, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a H160 message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns H160
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): apibara.ethereum.v1alpha2.H160;

                /**
                 * Decodes a H160 message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns H160
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): apibara.ethereum.v1alpha2.H160;

                /**
                 * Verifies a H160 message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a H160 message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns H160
                 */
                public static fromObject(object: { [k: string]: any }): apibara.ethereum.v1alpha2.H160;

                /**
                 * Creates a plain object from a H160 message. Also converts values to other types if specified.
                 * @param message H160
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: apibara.ethereum.v1alpha2.H160, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this H160 to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for H160
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }
        }
    }
}

/** Namespace google. */
export namespace google {

    /** Namespace protobuf. */
    namespace protobuf {

        /** Properties of a Timestamp. */
        interface ITimestamp {

            /** Timestamp seconds */
            seconds?: (number|Long|null);

            /** Timestamp nanos */
            nanos?: (number|null);
        }

        /** Represents a Timestamp. */
        class Timestamp implements ITimestamp {

            /**
             * Constructs a new Timestamp.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.ITimestamp);

            /** Timestamp seconds. */
            public seconds: (number|Long);

            /** Timestamp nanos. */
            public nanos: number;

            /**
             * Creates a new Timestamp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Timestamp instance
             */
            public static create(properties?: google.protobuf.ITimestamp): google.protobuf.Timestamp;

            /**
             * Encodes the specified Timestamp message. Does not implicitly {@link google.protobuf.Timestamp.verify|verify} messages.
             * @param message Timestamp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.ITimestamp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Timestamp message, length delimited. Does not implicitly {@link google.protobuf.Timestamp.verify|verify} messages.
             * @param message Timestamp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.ITimestamp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Timestamp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Timestamp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Timestamp;

            /**
             * Decodes a Timestamp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Timestamp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Timestamp;

            /**
             * Verifies a Timestamp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Timestamp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Timestamp
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.Timestamp;

            /**
             * Creates a plain object from a Timestamp message. Also converts values to other types if specified.
             * @param message Timestamp
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.Timestamp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Timestamp to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Timestamp
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }
    }
}
