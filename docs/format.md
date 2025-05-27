# Format

## Overall structure

- A _descriptor_ is a JSON object with at least two fields: `id` and `type`.
- `type` MUST be a `string` matching the regular expression `TODO`.
- `id` is calculated by recursively hashing (see below for specific algorithm) the values of all the other fields (including `type`) and then encoding it using [multibase](https://github.com/multiformats/multibase) and [multihash](https://github.com/multiformats/multihash).
- `id` MUST be hashed using SHA-256 and encoded using `base64url`.
  In the future additional hash algorithms and encodings might be supported.
- When receiving a descriptor from an untrusted source the descriptor should be hashed to validate that the `id` matches.
- Numbers are not allowed, and you'll have to serialize them as a string instead.
  This is because numbers in JSON are poorly specified and there's very few guarantees that JSON numbers produced by one serializer will reliably be consistent with a different deserializer.

## Hashing algorithm

The hash is built by recursively traversing the JSON object and producing a custom byte sequence.
This ensures a consistent hash even when a descriptor is used across different languages and JSON encoders/decoders.

| Tag            | Value (byte) |
| -------------- | ------------ |
| `NULL`         | `n` (0x6e)   |
| `TRUE`         | `t` (0x74)   |
| `FALSE`        | `f` (0x66)   |
| `STRING`       | `s` (0x73)   |
| `ARRAY_START`  | `a` (0x61)   |
| `ARRAY_END`    | `A` (0x41)   |
| `OBJECT_START` | `o` (0x6f)   |
| `OBJECT_END`   | `O` (0x4f)   |

Algorithm:

- If the value is `null`: Emit the tag `NULL`.
- If the value is `true`: Emit the tag `TRUE`.
- If the value is `false`: Emit the tag `FALSE`.
- If the value is a string: Emit the tag `STRING` followed by the string encoded in UTF-8.
- If the value is an array:
  - Emit `ARRAY_START`.
  - Loop over each element and emit each value recursively.
  - Emit `ARRAY_END`.
- If the value is an object:
  - Emit `OBJECT_START`.
  - Loop over each pair:
    - Emit the key as an UTF-8 encoded string.
    - Emit the value recursively.
  - Emit `OBJECT_END`.
