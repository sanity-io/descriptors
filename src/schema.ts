import {type EncodableObject, encode, type Encoded, type ID} from './encoder'
import {SetSketch} from './reconciler'

/**
 * A schema registry contains a set of named types.
 */
export interface Registry extends EncodableObject {
  content: ID[]
}

/**
 * A definition of a "core type". This is tied to a specific `jsonType` representation.
 */
export interface CoreTypeDef extends EncodableObject {
  subtypeOf: null
  jsonType: 'boolean' | 'number' | 'string' | 'object' | 'array'
}

/**
 * A subtype of another, named, type.
 */
export interface SubtypeDef extends EncodableObject {
  subtypeOf: string
}

export type TypeDef = CoreTypeDef | SubtypeDef

/**
 * The declaration of a named type.
 */
export interface NamedType extends EncodableObject {
  name: string
  typeDef: TypeDef
}

export type EncodedRegistry = Encoded<'sanity.schema.registry', Registry>
export type EncodedNamedType = Encoded<'sanity.schema.namedType', NamedType>

/**
 * RegistryEncoder is a helper class to encode a registry with all of its type definition.
 *
 * @public
 */
export class RegistryEncoder {
  namedTypes: EncodedNamedType[] = []
  types: Set<ID> = new Set()
  sketch: SetSketch = new SetSketch(32, 8)

  addTypeDef(name: string, typeDef: TypeDef): void {
    const encoded = encode(
      'sanity.schema.namedType',
      {name, typeDef},
      {
        withDigest: (digest) => {
          this.sketch.toggle(digest)
        },
      },
    )
    this.namedTypes.push(encoded)
    this.types.add(encoded.id)
  }

  finalize(): {registry: EncodedRegistry; namedTypes: EncodedNamedType[]} {
    const registry: EncodedRegistry = encode('sanity.schema.registry', {
      content: [...this.types].sort(),
    })
    return {registry, namedTypes: this.namedTypes}
  }
}
