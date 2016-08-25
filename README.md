# iterable-ts
A TypeScript library for working with iterable types

[![npm version](https://badge.fury.io/js/iterable-ts.svg)](https://badge.fury.io/js/iterable-ts)
[![Build Status](https://travis-ci.org/sergey-shandar/iterable-ts.svg?branch=master)](https://travis-ci.org/sergey-shandar/iterable-ts)

## Iterable Type

```ts
type I<T> = Stateless<T> | () => Iterable<T> | T[];
```
