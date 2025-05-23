# Synchronization Protocol

The synchronization protocol for descriptors is based on the paper ["Better Space-Time-Robustness Trade-Offs for Set Reconciliation"][simple-set] by Djamal Belazzougui, Gregory Kucherov, and Stefan Walzer.
This enables us to efficiently synchronize a schema consisting of _hundreds_ of types to the server even when just a single field has been modified.

## Approach

1. The client sends (1) a _context key_ representing the context in which this definition is used (e.g. project/dataset), (2) the final `id` that it wants to store and (3) a _sketch data structure_ containing information about _all_ the definitions.
2. This leads to three different scenarios for the server:
   1. The server already has the definition with the same `id`.
      If so, it can record internally that the client (with the given context) has synchronized it and respond back to the client.
      The client doesn't have to do anything further.
   2. The server, from its database, retrieves the _previously_ synchronized definition with the same context key.
      It merges it into the sketch retrieved to reconstruct the difference between these two definitions.
      If the difference is successfully decoded it calculates the recovered `id` of the final definition.
      If this matches, it will report back to the client with (1) the `id` of the previously synchronized definition (2) a list of `id` which the server is lacking.
   3. Otherwise, the server isn't capable of doing efficient synchronization.
3. Depending on the result from the server, the client might need.

## Set Difference Reconciliation Algorithm

The set difference reconciliation algorithm is the exact same as "Figure 1" in ["Better Space-Time-Robustness Trade-Offs for Set Reconciliation"][simple-set] where the hash function is defined as `hash_k(val) = val[k]` where `val[k]` accesses the `k`-th byte of the `n`-byte integer.
This simple hash function works well for our case since we're dealing with SHA-256 digests which consists of 32 uniform random bytes.

[simple-set]: https://doi.org/10.4230/LIPIcs.ICALP.2024.20
