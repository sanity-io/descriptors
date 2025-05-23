import {Hash} from 'sha256-uint8array'

/** The ID if a descriptor. */
export type ID = string

/**
 * A descriptor with an `id` and `type`.
 *
 * @public
 */
export type Encoded<T extends string, U extends EncodableObject> = U & {id: ID; type: T}

/**
 * The subset of values which we can encode.
 *
 * @public
 */
export type EncodableValue =
  | EncodableObject
  | Array<EncodableValue>
  | boolean
  | number
  | string
  | null

/**
 * A JavaScript object which can be encoded as a descriptor.
 * @public
 */
export type EncodableObject = {[key: string]: EncodableValue | undefined}

// Not sure why, but ESLint thinks that this shadows an existing identifier.
// eslint-disable-next-line no-shadow
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
  buffer: ArrayBuffer = new ArrayBuffer(4)
  uint8 = new Uint8Array(this.buffer)
  uint8_byte = new Uint8Array(this.buffer, 0, 1)
  int32 = new Int32Array(this.buffer)

  encodeByte(byte: number) {
    this.uint8_byte[0] = byte
    this.hash.update(this.uint8_byte)
  }

  encodeString(val: string) {
    this.hash.update(val, 'utf8')
  }

  encodeInt32(val: number) {
    this.int32[0] = val
    if (this.int32[0] !== val) throw new Error('Only 32-bit numbers can be encoded as descriptors')
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
      this.encodeInt32(val)
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
      this.encodeValue(field)
    }
    this.encodeByte(Tag.OBJECT_END)
  }

  getDigest() {
    return this.hash.digest()
  }
}

/**
 * Encodes binary data into the base64url format as specified by multibase:
 * https://github.com/multiformats/multibase.
 *
 * @public
 */
export function encodeBase64(data: Uint8Array, prefix: string = ''): string {
  let binary = prefix
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i])
  }
  return 'u' + window.btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

/**
 * Encodes a SHA256 hash (which should be 32 bytes long) as specified by multihash:
 * https://github.com/multiformats/multihash.
 *
 * @public
 */
export function encodeBase64Sha256(data: Uint8Array): string {
  return encodeBase64(data, MULTIHASH_SHA256)
}

/**
 * Decodes a base64 value encoded using multibase.
 *
 * @public
 */
export function decodeBase64(input: string, into: Uint8Array): void {
  if (input[0] !== 'u') throw new Error('Invalid base64')

  const binary = window.atob(input.slice(1).replaceAll('-', '+').replaceAll('_', '/'))
  for (let i = 0; i < binary.length; i++) {
    into[i] = binary.charCodeAt(i)
  }
}

/**
 * Encodes an object with the given type.
 */
export function encode<Type extends string, Props extends EncodableObject>(
  type: Type,
  props: Props,
  options?: {
    /**
     * This is invoked with the raw SHA256 hash, which will also be placed in
     * `id` in encoded form.
     **/
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
