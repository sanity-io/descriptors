# Format

## Overall structure

- A _serialized definition_ is a JSON object with at least two fields: `id` and `type`.
- `type` MUST be a `string` matching the regular expression `TODO`.
- `id` is calculated by recursively hashing (see below for specific algorithm) the values of all the other fields (including `type`) and then encoding it using [multibase](https://github.com/multiformats/multibase) and [multihash](https://github.com/multiformats/multihash).
- `id` MUST be hashed using SHA-256 and encoded using `base64url`.
  In the future additional hash algorithms and encodings might be supported.
- When receiving a serialized definition from an untrusted source the serialized definition should be hashed to validate that the `id` matches.
- Numbers are hashed using their 64-bit floating point number representation.
  The JSON MUST be encoded in such a way that it produces the exact same bit representation when parsed.
