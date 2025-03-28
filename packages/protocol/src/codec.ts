/*

   █████████               █████                  
  ███░░░░░███             ░░███                   
 ███     ░░░   ██████   ███████   ██████   ██████ 
░███          ███░░███ ███░░███  ███░░███ ███░░███
░███         ░███ ░███░███ ░███ ░███████ ░███ ░░░ 
░░███     ███░███ ░███░███ ░███ ░███░░░  ░███  ███
 ░░█████████ ░░██████ ░░████████░░██████ ░░██████ 
  ░░░░░░░░░   ░░░░░░   ░░░░░░░░  ░░░░░░   ░░░░░░  
                                                  
*/

/** Codec to encode and decode protobuf messages */
export type Codec<TApp = unknown, TProto = unknown> = {
  encode(app: TApp): TProto;
  decode(proto: TProto): TApp;
};

/* Helper to get the high-level type of a codec */
export type CodecType<C extends Codec> = ReturnType<C["decode"]>;

/* Helper to get the protobuf type of a codec */
export type CodecProto<C extends Codec> = ReturnType<C["encode"]>;

/*
 
 ██████   ██████                                                     
░░██████ ██████                                                      
 ░███░█████░███   ██████   █████   █████   ██████    ███████  ██████ 
 ░███░░███ ░███  ███░░███ ███░░   ███░░   ░░░░░███  ███░░███ ███░░███
 ░███ ░░░  ░███ ░███████ ░░█████ ░░█████   ███████ ░███ ░███░███████ 
 ░███      ░███ ░███░░░   ░░░░███ ░░░░███ ███░░███ ░███ ░███░███░░░  
 █████     █████░░██████  ██████  ██████ ░░████████░░███████░░██████ 
░░░░░     ░░░░░  ░░░░░░  ░░░░░░  ░░░░░░   ░░░░░░░░  ░░░░░███ ░░░░░░  
                                                    ███ ░███         
                                                   ░░██████          
                                                    ░░░░░░                                                                             
*/

export type Evaluate<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type TPropertyKey = string | symbol;
// Message properties as codec.
type TProperties = Record<TPropertyKey, Codec>;

// Optional properties in an object.
// Properties are optional when they have the `undefined` type.
type OptionalPropertyKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];

// Properties that are not optional are required.
type RequiredPropertyKeys<T> = keyof Omit<T, OptionalPropertyKeys<T>>;

// Helper to get the app type of a message codec.
type _MessageCodecType<T extends TProperties> = {
  [K in keyof T]: CodecType<T[K]>;
};

// Helper to get the protobuf type of a message codec.
type _MessageCodecProto<T extends TProperties> = {
  [K in keyof T]: CodecProto<T[K]>;
};

// Adjust the app type of the codec so that optional properties are optional.
type MessageCodecType<T extends TProperties> =
  _MessageCodecType<T> extends infer R
    ? Evaluate<Partial<R> & Required<Pick<R, RequiredPropertyKeys<R>>>>
    : never;

// Adjust the protobuf type of the codec so that optional properties are optional.
type MessageCodecProto<T extends TProperties> =
  _MessageCodecProto<T> extends infer R
    ? Evaluate<Partial<R> & Required<Pick<R, RequiredPropertyKeys<R>>>>
    : never;

export type MessageCodec<T extends TProperties = TProperties> = Codec<
  MessageCodecType<T>,
  MessageCodecProto<T>
>;

export function MessageCodec<T extends TProperties>(
  schema: T,
): MessageCodec<T> {
  return {
    encode(app) {
      return new Proxy(app, {
        get(target, property) {
          if (!Object.hasOwn(target, property)) {
            return Reflect.get(target, property);
          }

          const v = Reflect.get(target, property);
          return schema[property].encode(v);
        },
      });
    },
    decode(proto) {
      return new Proxy(proto, {
        get(target, property) {
          if (!Object.hasOwn(target, property)) {
            return Reflect.get(target, property);
          }

          const v = Reflect.get(target, property);
          return schema[property].decode(v);
        },
      });
    },
  };
}

/*
   █████████                                           
  ███░░░░░███                                          
 ░███    ░███  ████████  ████████   ██████   █████ ████
 ░███████████ ░░███░░███░░███░░███ ░░░░░███ ░░███ ░███ 
 ░███░░░░░███  ░███ ░░░  ░███ ░░░   ███████  ░███ ░███ 
 ░███    ░███  ░███      ░███      ███░░███  ░███ ░███ 
 █████   █████ █████     █████    ░░████████ ░░███████ 
░░░░░   ░░░░░ ░░░░░     ░░░░░      ░░░░░░░░   ░░░░░███ 
                                              ███ ░███ 
                                             ░░██████  
                                              ░░░░░░   
                                                                    
*/

export type ArrayCodec<T extends Codec> = T extends Codec<
  infer TApp,
  infer TProto
>
  ? Codec<readonly TApp[], readonly TProto[] | undefined>
  : never;

export function ArrayCodec<T extends Codec<TApp, TProto>, TApp, TProto>(
  t: T,
): ArrayCodec<T> {
  return {
    encode(app) {
      return app.map(t.encode) as readonly TProto[];
    },
    decode(proto) {
      if (proto === undefined) return [];
      return proto.map(t.decode) as readonly TApp[];
    },
  } as ArrayCodec<T>;
}

/*
    ███████               █████     ███                                ████ 
  ███░░░░░███            ░░███     ░░░                                ░░███ 
 ███     ░░███ ████████  ███████   ████   ██████  ████████    ██████   ░███ 
░███      ░███░░███░░███░░░███░   ░░███  ███░░███░░███░░███  ░░░░░███  ░███ 
░███      ░███ ░███ ░███  ░███     ░███ ░███ ░███ ░███ ░███   ███████  ░███ 
░░███     ███  ░███ ░███  ░███ ███ ░███ ░███ ░███ ░███ ░███  ███░░███  ░███ 
 ░░░███████░   ░███████   ░░█████  █████░░██████  ████ █████░░████████ █████
   ░░░░░░░     ░███░░░     ░░░░░  ░░░░░  ░░░░░░  ░░░░ ░░░░░  ░░░░░░░░ ░░░░░ 
               ░███                                                         
               █████                                                        
              ░░░░░                                                                                                                                                  
*/

export type OptionalCodec<T extends Codec> = T extends Codec<
  infer TApp,
  infer TProto
>
  ? Codec<TApp | undefined, TProto | undefined>
  : never;

export function OptionalCodec<T extends Codec>(t: T): OptionalCodec<T> {
  return {
    encode(app) {
      if (app === undefined) return undefined;
      return t.encode(app);
    },
    decode(proto) {
      if (proto === undefined) return undefined;
      return t.decode(proto);
    },
  } as OptionalCodec<T>;
}

/*
 ███████████                                  ███                         █████
░░███░░░░░███                                ░░░                         ░░███ 
 ░███    ░███   ██████   ████████ █████ ████ ████  ████████   ██████   ███████ 
 ░██████████   ███░░███ ███░░███ ░░███ ░███ ░░███ ░░███░░███ ███░░███ ███░░███ 
 ░███░░░░░███ ░███████ ░███ ░███  ░███ ░███  ░███  ░███ ░░░ ░███████ ░███ ░███ 
 ░███    ░███ ░███░░░  ░███ ░███  ░███ ░███  ░███  ░███     ░███░░░  ░███ ░███ 
 █████   █████░░██████ ░░███████  ░░████████ █████ █████    ░░██████ ░░████████
░░░░░   ░░░░░  ░░░░░░   ░░░░░███   ░░░░░░░░ ░░░░░ ░░░░░      ░░░░░░   ░░░░░░░░ 
                            ░███                                               
                            █████                                              
                           ░░░░░                                                                                                                                                           
*/

export type RequiredCodec<T extends Codec> = T extends Codec<
  infer TApp,
  infer TProto
>
  ? TApp extends undefined
    ? never
    : Codec<TApp, TProto | undefined>
  : never;

export function RequiredCodec<T extends Codec>(t: T): RequiredCodec<T> {
  return {
    encode(app) {
      if (app === undefined) throw new Error("Value is required but undefined");
      return t.encode(app);
    },
    decode(proto) {
      if (proto === undefined)
        throw new Error("Value is required but undefined");
      return t.decode(proto);
    },
  } as RequiredCodec<T>;
}

/*
 ██████   █████            ████  ████     ███████             
░░██████ ░░███            ░░███ ░░███   ███░░░░░███           
 ░███░███ ░███  █████ ████ ░███  ░███  ███     ░░███ ████████ 
 ░███░░███░███ ░░███ ░███  ░███  ░███ ░███      ░███░░███░░███
 ░███ ░░██████  ░███ ░███  ░███  ░███ ░███      ░███ ░███ ░░░ 
 ░███  ░░█████  ░███ ░███  ░███  ░███ ░░███     ███  ░███     
 █████  ░░█████ ░░████████ █████ █████ ░░░███████░   █████    
░░░░░    ░░░░░   ░░░░░░░░ ░░░░░ ░░░░░    ░░░░░░░    ░░░░░     
*/

export type NullOrCodec<T extends Codec> = T extends Codec<
  infer TApp,
  infer TProto
>
  ? Codec<TApp | null, TProto | null>
  : never;

export function NullOrCodec<T extends Codec>(t: T): NullOrCodec<T> {
  return {
    encode(app) {
      if (app === null) return null;
      return t.encode(app);
    },
    decode(proto) {
      if (proto === null) return null;
      return t.decode(proto);
    },
  } as NullOrCodec<T>;
}

/*

 ███████████   ███           █████             █████   
░░███░░░░░███ ░░░           ░░███             ░░███    
 ░███    ░███ ████   ███████ ░███  ████████   ███████  
 ░██████████ ░░███  ███░░███ ░███ ░░███░░███ ░░░███░   
 ░███░░░░░███ ░███ ░███ ░███ ░███  ░███ ░███   ░███    
 ░███    ░███ ░███ ░███ ░███ ░███  ░███ ░███   ░███ ███
 ███████████  █████░░███████ █████ ████ █████  ░░█████ 
░░░░░░░░░░░  ░░░░░  ░░░░░███░░░░░ ░░░░ ░░░░░    ░░░░░  
                    ███ ░███                           
                   ░░██████                            
                    ░░░░░░                                                                             
*/

export type BigIntCodec = CodecType<typeof BigIntCodec>;

export const BigIntCodec: Codec<bigint, bigint> = {
  encode(app) {
    return app;
  },
  decode(proto) {
    return proto;
  },
};

/*

 ██████   █████                            █████                       
░░██████ ░░███                            ░░███                        
 ░███░███ ░███  █████ ████ █████████████   ░███████   ██████  ████████ 
 ░███░░███░███ ░░███ ░███ ░░███░░███░░███  ░███░░███ ███░░███░░███░░███
 ░███ ░░██████  ░███ ░███  ░███ ░███ ░███  ░███ ░███░███████  ░███ ░░░ 
 ░███  ░░█████  ░███ ░███  ░███ ░███ ░███  ░███ ░███░███░░░   ░███     
 █████  ░░█████ ░░████████ █████░███ █████ ████████ ░░██████  █████    
░░░░░    ░░░░░   ░░░░░░░░ ░░░░░ ░░░ ░░░░░ ░░░░░░░░   ░░░░░░  ░░░░░     
                                                                                  
*/

export type NumberCodec = CodecType<typeof NumberCodec>;

export const NumberCodec: Codec<number, number> = {
  encode(app) {
    return app;
  },
  decode(proto) {
    return proto;
  },
};

/*
 █████  █████  ███              █████     ████████     █████████                                           
░░███  ░░███  ░░░              ░░███     ███░░░░███   ███░░░░░███                                          
 ░███   ░███  ████  ████████   ███████  ░███   ░███  ░███    ░███  ████████  ████████   ██████   █████ ████
 ░███   ░███ ░░███ ░░███░░███ ░░░███░   ░░████████   ░███████████ ░░███░░███░░███░░███ ░░░░░███ ░░███ ░███ 
 ░███   ░███  ░███  ░███ ░███   ░███     ███░░░░███  ░███░░░░░███  ░███ ░░░  ░███ ░░░   ███████  ░███ ░███ 
 ░███   ░███  ░███  ░███ ░███   ░███ ███░███   ░███  ░███    ░███  ░███      ░███      ███░░███  ░███ ░███ 
 ░░████████   █████ ████ █████  ░░█████ ░░████████   █████   █████ █████     █████    ░░████████ ░░███████ 
  ░░░░░░░░   ░░░░░ ░░░░ ░░░░░    ░░░░░   ░░░░░░░░   ░░░░░   ░░░░░ ░░░░░     ░░░░░      ░░░░░░░░   ░░░░░███ 
                                                                                                  ███ ░███ 
                                                                                                 ░░██████  
                                                                                                  ░░░░░░   
*/

export type Uint8ArrayCodec = CodecType<typeof Uint8ArrayCodec>;

export const Uint8ArrayCodec: Codec<Uint8Array, Uint8Array> = {
  encode(app) {
    return app;
  },
  decode(proto) {
    return proto;
  },
};

/*

 ██████████              █████            
░░███░░░░███            ░░███             
 ░███   ░░███  ██████   ███████    ██████ 
 ░███    ░███ ░░░░░███ ░░░███░    ███░░███
 ░███    ░███  ███████   ░███    ░███████ 
 ░███    ███  ███░░███   ░███ ███░███░░░  
 ██████████  ░░████████  ░░█████ ░░██████ 
░░░░░░░░░░    ░░░░░░░░    ░░░░░   ░░░░░░  
                                          
*/

export type DateCodec = CodecType<typeof DateCodec>;

export const DateCodec: Codec<Date, Date> = {
  encode(app) {
    return new Date(app);
  },
  decode(proto) {
    return new Date(proto);
  },
};

/*

 ███████████                    ████                               
░░███░░░░░███                  ░░███                               
 ░███    ░███  ██████   ██████  ░███   ██████   ██████   ████████  
 ░██████████  ███░░███ ███░░███ ░███  ███░░███ ░░░░░███ ░░███░░███ 
 ░███░░░░░███░███ ░███░███ ░███ ░███ ░███████   ███████  ░███ ░███ 
 ░███    ░███░███ ░███░███ ░███ ░███ ░███░░░   ███░░███  ░███ ░███ 
 ███████████ ░░██████ ░░██████  █████░░██████ ░░████████ ████ █████
░░░░░░░░░░░   ░░░░░░   ░░░░░░  ░░░░░  ░░░░░░   ░░░░░░░░ ░░░░ ░░░░░ 
                                          
*/

export type BooleanCodec = CodecType<typeof BooleanCodec>;

export const BooleanCodec: Codec<boolean, boolean> = {
  encode(app) {
    return app;
  },
  decode(proto) {
    return proto;
  },
};

/*

  █████████   █████               ███                     
 ███░░░░░███ ░░███               ░░░                      
░███    ░░░  ███████   ████████  ████  ████████    ███████
░░█████████ ░░░███░   ░░███░░███░░███ ░░███░░███  ███░░███
 ░░░░░░░░███  ░███     ░███ ░░░  ░███  ░███ ░███ ░███ ░███
 ███    ░███  ░███ ███ ░███      ░███  ░███ ░███ ░███ ░███
░░█████████   ░░█████  █████     █████ ████ █████░░███████
 ░░░░░░░░░     ░░░░░  ░░░░░     ░░░░░ ░░░░ ░░░░░  ░░░░░███
                                                  ███ ░███
                                                 ░░██████ 
                                                  ░░░░░░  
*/

export type StringCodec = CodecType<typeof StringCodec>;

export const StringCodec: Codec<string, string> = {
  encode(app) {
    return app;
  },
  decode(proto) {
    return proto;
  },
};

/*

 █████  █████                █████             ██████   ███                          █████
░░███  ░░███                ░░███             ███░░███ ░░░                          ░░███ 
 ░███   ░███  ████████    ███████   ██████   ░███ ░░░  ████  ████████    ██████   ███████ 
 ░███   ░███ ░░███░░███  ███░░███  ███░░███ ███████   ░░███ ░░███░░███  ███░░███ ███░░███ 
 ░███   ░███  ░███ ░███ ░███ ░███ ░███████ ░░░███░     ░███  ░███ ░███ ░███████ ░███ ░███ 
 ░███   ░███  ░███ ░███ ░███ ░███ ░███░░░    ░███      ░███  ░███ ░███ ░███░░░  ░███ ░███ 
 ░░████████   ████ █████░░████████░░██████   █████     █████ ████ █████░░██████ ░░████████
  ░░░░░░░░   ░░░░ ░░░░░  ░░░░░░░░  ░░░░░░   ░░░░░     ░░░░░ ░░░░ ░░░░░  ░░░░░░   ░░░░░░░░ 
                                          
*/

export type UndefinedCodec = CodecType<typeof UndefinedCodec>;

export const UndefinedCodec: Codec<undefined, undefined> = {
  encode(app) {
    return undefined;
  },
  decode(proto) {
    return undefined;
  },
};

/*
 █████        ███   █████                                 ████ 
░░███        ░░░   ░░███                                 ░░███ 
 ░███        ████  ███████    ██████  ████████   ██████   ░███ 
 ░███       ░░███ ░░░███░    ███░░███░░███░░███ ░░░░░███  ░███ 
 ░███        ░███   ░███    ░███████  ░███ ░░░   ███████  ░███ 
 ░███      █ ░███   ░███ ███░███░░░   ░███      ███░░███  ░███ 
 ███████████ █████  ░░█████ ░░██████  █████    ░░████████ █████
░░░░░░░░░░░ ░░░░░    ░░░░░   ░░░░░░  ░░░░░      ░░░░░░░░ ░░░░░ 
                                                               
*/

type Literal = string | number | boolean | null | undefined;

export type LiteralCodec<T extends Codec, L extends Literal> = T extends Codec<
  infer TApp,
  infer TProto
>
  ? Codec<TApp, TProto>
  : never;

export const LiteralCodec = <const L extends Literal>(
  value: L,
): LiteralCodec<Codec<L, L>, L> => {
  return {
    encode(app) {
      if (app !== value) {
        throw new Error(`Expected ${String(value)}, got ${String(app)}`);
      }
      return app;
    },
    decode(proto) {
      if (proto !== value) {
        throw new Error(`Expected ${String(value)}, got ${String(proto)}`);
      }
      return proto;
    },
  } as LiteralCodec<Codec<L, L>, L>;
};

/*
 █████        ███   █████                                 ████  █████  █████             ███                     
░░███        ░░░   ░░███                                 ░░███ ░░███  ░░███             ░░░                      
 ░███        ████  ███████    ██████  ████████   ██████   ░███  ░███   ░███  ████████   ████   ██████  ████████  
 ░███       ░░███ ░░░███░    ███░░███░░███░░███ ░░░░░███  ░███  ░███   ░███ ░░███░░███ ░░███  ███░░███░░███░░███ 
 ░███        ░███   ░███    ░███████  ░███ ░░░   ███████  ░███  ░███   ░███  ░███ ░███  ░███ ░███ ░███ ░███ ░███ 
 ░███      █ ░███   ░███ ███░███░░░   ░███      ███░░███  ░███  ░███   ░███  ░███ ░███  ░███ ░███ ░███ ░███ ░███ 
 ███████████ █████  ░░█████ ░░██████  █████    ░░████████ █████ ░░████████   ████ █████ █████░░██████  ████ █████
░░░░░░░░░░░ ░░░░░    ░░░░░   ░░░░░░  ░░░░░      ░░░░░░░░ ░░░░░   ░░░░░░░░   ░░░░ ░░░░░ ░░░░░  ░░░░░░  ░░░░ ░░░░░ 
*/

export type LiteralUnionCodec<
  T extends Codec,
  L extends readonly Literal[],
> = T extends Codec<infer TApp, infer TProto> ? Codec<TApp, TProto> : never;

export const LiteralUnionCodec = <const L extends readonly Literal[]>(
  values: L,
): LiteralUnionCodec<Codec<L[number], L[number]>, L> => {
  return {
    encode(app) {
      if (!values.includes(app as L[number])) {
        throw new Error(
          `Expected one of [${values.join(", ")}], got ${String(app)}`,
        );
      }
      return app;
    },
    decode(proto) {
      if (!values.includes(proto as L[number])) {
        throw new Error(
          `Expected one of [${values.join(", ")}], got ${String(proto)}`,
        );
      }
      return proto;
    },
  } as LiteralUnionCodec<Codec<L[number], L[number]>, L>;
};

/*
 █████   █████                      ███                        █████   
░░███   ░░███                      ░░░                        ░░███    
 ░███    ░███   ██████   ████████  ████   ██████   ████████   ███████  
 ░███    ░███  ░░░░░███ ░░███░░███░░███  ░░░░░███ ░░███░░███ ░░░███░   
 ░░███   ███    ███████  ░███ ░░░  ░███   ███████  ░███ ░███   ░███    
  ░░░█████░    ███░░███  ░███      ░███  ███░░███  ░███ ░███   ░███ ███
    ░░███     ░░████████ █████     █████░░████████ ████ █████  ░░█████ 
     ░░░       ░░░░░░░░ ░░░░░     ░░░░░  ░░░░░░░░ ░░░░ ░░░░░    ░░░░░  
*/

// Maps variant keys to their corresponding decoded types, adding a tag field
// For example: { _tag: "declareV1", declareV1: { data: string } }
// if the variant is undefined type, it will be just the tag - { _tag: "heartbeat" }
type AppVariantMap<TTag extends TPropertyKey, TVariants extends TProperties> = {
  [K in keyof TVariants]: {
    [P in TTag]: K;
  } & (CodecType<TVariants[K]> extends UndefinedCodec
    ? // biome-ignore lint/complexity/noBannedTypes: had to return empty object to satisfy type
      {}
    : { [P in K & TPropertyKey]: CodecType<TVariants[K]> });
};
type VariantCodecType<
  TTag extends TPropertyKey,
  TVariants extends TProperties,
> = AppVariantMap<TTag, TVariants>[keyof TVariants];

// Maps variant keys to their corresponding encoded types, adding a discriminator field
// For example: { $case: "declareV1", declareV1: { data: string } }
type ProtoVariantMap<
  TDiscriminator extends TPropertyKey,
  TVariants extends TProperties,
> = {
  [K in keyof TVariants]: {
    [P in TDiscriminator]: K;
  } & {
    [P in K & TPropertyKey]: CodecProto<TVariants[K]>;
  };
};

type VariantCodecProto<
  TDiscriminator extends TPropertyKey,
  TVariants extends TProperties,
> = ProtoVariantMap<TDiscriminator, TVariants>[keyof TVariants];

// Type helper for VariantCodec that preserves the input/output types
export type VariantCodec<
  T extends Codec,
  TTag extends TPropertyKey,
  TDiscriminator extends TPropertyKey,
> = T extends Codec<infer TApp, infer TProto> ? Codec<TApp, TProto> : never;

export const VariantCodec = <
  TTag extends TPropertyKey,
  TDiscriminator extends TPropertyKey,
  TVariants extends TProperties,
  TCodec extends Codec<
    VariantCodecType<TTag, TVariants>,
    VariantCodecProto<TDiscriminator, TVariants>
  >,
>(options: {
  tag: TTag;
  discriminator: TDiscriminator;
  variants: TVariants;
}): VariantCodec<TCodec, TTag, TDiscriminator> => {
  return {
    encode(app) {
      const tag = app[options.tag];
      const codec = options.variants[tag];
      if (!codec) {
        throw new Error(`Unknown variant: ${String(tag)}`);
      }

      const variantData = app[tag as keyof typeof app];
      const encodedData = codec.encode(variantData);

      return {
        [options.discriminator]: tag,
        [tag]: encodedData,
      };
    },
    decode(proto) {
      const tag = proto[options.discriminator];
      const codec = options.variants[tag];
      if (!codec) {
        throw new Error(`Unknown variant: ${String(tag)}`);
      }

      const variantData = proto[tag as keyof typeof proto];
      const decodedData = codec.decode(variantData);

      return {
        [options.tag]: tag,
        [tag]: decodedData,
      };
    },
  } as VariantCodec<TCodec, TTag, TDiscriminator>;
};

/*
    ███████                           ███████       ██████ 
  ███░░░░░███                       ███░░░░░███    ███░░███
 ███     ░░███ ████████    ██████  ███     ░░███  ░███ ░░░ 
░███      ░███░░███░░███  ███░░███░███      ░███ ███████   
░███      ░███ ░███ ░███ ░███████ ░███      ░███░░░███░    
░░███     ███  ░███ ░███ ░███░░░  ░░███     ███   ░███     
 ░░░███████░   ████ █████░░██████  ░░░███████░    █████    
   ░░░░░░░    ░░░░ ░░░░░  ░░░░░░     ░░░░░░░     ░░░░░     
                                                           
*/

export type OneOfCodec<TVariants extends TProperties> = VariantCodec<
  Codec<
    VariantCodecType<"_tag", TVariants>,
    VariantCodecProto<"$case", TVariants>
  >,
  "_tag",
  "$case"
>;

export function OneOfCodec<TVariants extends TProperties>(
  variants: TVariants,
): OneOfCodec<TVariants> {
  return VariantCodec({
    tag: "_tag",
    discriminator: "$case",
    variants,
  });
}
