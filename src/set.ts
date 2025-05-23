import {type EncodableObject, encode, type Encoded} from './encoder'
import {SetSketch} from './reconciler'

/**
 * A set descriptor. This follows the very specific form with a property called
 * `keys` containing other descriptor IDs.
 *
 * @public
 */
export type EncodedSet<Type extends string> = Encoded<Type, {keys: string[]}>

/**
 * SetSynchronization contains information about a set so that it can be
 * synchronized.
 *
 * @public
 */
export interface SetSynchronization<Type extends string> {
  /** @internal */
  set: EncodedSet<Type>

  /** @internal */
  digest: Uint8Array

  /** @internal */
  objectValues: Record<string, Encoded<string, EncodableObject>>

  /** @internal */
  setValues: Record<string, SetSynchronization<string>>
  /** @internal */
  sketch: SetSketch
}

/**
 * SetBuilder is a class which helps you construct a set for efficient synchronization.
 *
 * @public
 */
export class SetBuilder {
  private objectValues: Record<string, Encoded<string, EncodableObject>> = {}
  private setValues: Record<string, SetSynchronization<string>> = {}
  private keys: string[] = []
  private sketch: SetSketch = new SetSketch(32, 8)

  /**
   * Add an object to the set.
   */
  addObject<Type extends string>(type: Type, obj: EncodableObject): void {
    const value = encode(type, obj, {
      withDigest: (digest) => {
        this.sketch.toggle(digest)
      },
    })
    this.objectValues[value.id] = value
    this.keys.push(value.id)
  }

  /**
   * Add another set to the set.
   */
  addSet<Type extends string>(sync: SetSynchronization<Type>): void {
    this.setValues[sync.set.id] = sync
    this.sketch.toggle(sync.digest)
    this.keys.push(sync.set.id)
  }

  build<Type extends string>(type: Type): SetSynchronization<Type> {
    this.keys.sort()

    let digest: Uint8Array

    const set = encode(
      type,
      {keys: this.keys},
      {
        withDigest: (d) => {
          digest = d
        },
      },
    )

    return {
      set,
      digest: digest!,
      objectValues: this.objectValues,
      setValues: this.setValues,
      sketch: this.sketch,
    }
  }
}
