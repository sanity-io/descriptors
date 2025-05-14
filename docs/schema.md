# Schema definition

The schema definition is split into two parts:

- The _basic_ definition is the overall structure of how types are related to each other through subtyping.
- The _extended_ definition defines the more specific set of properties which is currently used (e.g. `fields`, `readOnly`, `hidden`).

## Basic definition

The _schema_ is defined with the following terms:

- A _schema registry_ is a list of type definition which each have been given a name.
- A _type definition_ (`TypeDef`) defines a type.
  This is a very flexible concept and can have many different properties.
- There's two different types of type definitions:
  A _core type definition_ is declared with a `jsonType` (`boolean`, `string`, `number`, `object`, `array`),
  while a _subtype definition_ is declared with a `subtypeOf`, which refers to another type definition in the registry.
- There's actually no way of referring to an existing type, but instead you'll have to declare a subtype as a type definition.
  In the example above you can see that the `reference` type refers to a `string` and `boolean` type.
  This is done by the field's type definition being a subtype with no further annotations.
