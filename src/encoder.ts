import {Hash} from 'sha256-uint8array'

export type ID = string

/**
 * A serialized definition with an `id` and `type`.
 */
export type Encoded<T extends string, U extends EncodableValue> = U & {id: ID; type: T}

/**
 * The subset of values which we can encode.
 */
export type EncodableValue =
  | EncodableObject
  | Array<EncodableValue>
  | boolean
  | number
  | string
  | null

export type EncodableObject = {[key: string]: EncodableValue}

enum Tag {
  NULL = 0,
  TRUE = 1,
  FALSE = 2,
  NUMBER = 3,
  STRING = 4,
  ARRAY_START = 5,
  ARRAY_END = 6,
  OBJECT_START = 7,
  OBJECT_END = 8,
}

const MULTIHASH_SHA256 = '\x12\x20'

class IDEncoder {
  hash: Hash = new Hash()
  buffer: ArrayBuffer = new ArrayBuffer(8)
  uint8 = new Uint8Array(this.buffer)
  uint8_byte = new Uint8Array(this.buffer, 0, 1)
  float64 = new Float64Array(this.buffer)

  encodeByte(byte: number) {
    this.uint8_byte[0] = byte
    this.hash.update(this.uint8_byte)
  }

  encodeString(val: string) {
    this.hash.update(val, 'utf8')
  }

  encodeFloat(val: number) {
    this.float64[0] = val
    this.hash.update(this.uint8)
  }

  encodeValue(val: EncodableValue) {
    if (val === null) {
      this.encodeByte(Tag.NULL)
    } else if (val === true) {
      this.encodeByte(Tag.TRUE)
    } else if (val === false) {
      this.encodeByte(Tag.FALSE)
    } else if (typeof val === 'number') {
      this.encodeByte(Tag.NUMBER)
      this.encodeFloat(val)
    } else if (typeof val === 'string') {
      this.encodeByte(Tag.STRING)
      this.encodeString(val)
    } else if (Array.isArray(val)) {
      this.encodeByte(Tag.ARRAY_START)
      for (const elem of val) {
        this.encodeValue(elem)
      }
      this.encodeByte(Tag.ARRAY_END)
    } else {
      this.encodeByte(Tag.OBJECT_START)
      for (const key of Object.keys(val).sort()) {
        const field = val[key]
        if (field === undefined) {
          continue
        }

        this.encodeString(key)
        this.encodeValue(field)
      }
      this.encodeByte(Tag.OBJECT_END)
    }
  }

  encodeObjectWithType(type: string, val: EncodableObject) {
    this.encodeByte(Tag.OBJECT_START)
    for (const key of ['type', ...Object.keys(val)].sort()) {
      const field = key === 'type' ? type : val[key]
      if (field === undefined) continue
      this.encodeString(key)
      this.encodeValue(val)
    }
    this.encodeByte(Tag.OBJECT_END)
  }

  getDigest() {
    return this.hash.digest()
  }
}

/**
 * @public
 */
export function encodeBase64(data: Uint8Array, prefix: string = ''): string {
  let binary = prefix
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i])
  }
  return 'u' + window.btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

export function encode<Type extends string, Props extends EncodableObject>(
  type: Type,
  props: Props,
  options?: {
    withDigest?: (digest: Uint8Array) => void
  },
): Encoded<Type, Props> {
  const idEncoder = new IDEncoder()
  idEncoder.encodeObjectWithType(type, props)
  const digest = idEncoder.getDigest()
  if (options?.withDigest) options.withDigest(digest)
  const id = encodeBase64(digest, MULTIHASH_SHA256)
  return {id, type, ...props}
}
