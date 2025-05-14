# Serialized Definitions

_Serialized Definitions_ (`sdefs`) is a way of serializing definitions (e.g. schema types) so they can be easily shared across Content Lake.
It has the following characteristics:

- **JSON native:**
  A serialized definition is encoded using JSON with support for the typical JSON values: Objects, arrays, strings, booleans, floats.
- **Content-addressable:** Each serialized definition has an `id` which is the SHA-256 hash of the contents.
  The same definition will always end up with the same `id`.
- **Recursively defined:**
  It's common for definitions to refer to _other_ definitions by their `id`.
  That way you can refer to a whole graph of interconnected definitions by a single root `id`.
  This is very similar to how a blockchain works, but without the utter waste of energy.
- **Efficient synchronization:**
  The format is designed so that it's possible to efficiently synchronize when there's only been a few changes on the client-side.
  This is possible without the client storing any additional information about the state of the server.

Here's an example of two definitions

```ts
{
  "id": "uEiA4r6C4bPFx1dMadoWeZ4ZJxLLXGzeNojZIsnGxp6g0rw",
  "type": "sanity.schema.registry"
  "content": [
    "uEiDPWicraeaSOVaZEUlyrF6RFDRURU4XCLsNR7zCLoNAcg",
    "uEiChs9ZdIsaYe7KLKSVk3b1yApMvlHIO8UvebgjJYTUMAQ"
  ]
}

{
  "id": "uEiChs9ZdIsaYe7KLKSVk3b1yApMvlHIO8UvebgjJYTUMAQ",
  "type": "sanity.schema.namedType",
  "name": "username",
  "typeDef": {
    "subtypeOf": "string",
    "title": "Username"
  }
}
```

To learn more:

- [docs/format.md](docs/format.md) describes the overall structure of the format.
- [docs/sync.md](docs/sync.md) describes the efficient synchronization protocol.
- [docs/schema.md](docs/schema.md) describes how we define a _schema_.
- [playground/](playground) is a demo application which shows the synchronization protocol.
