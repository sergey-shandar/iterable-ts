# iterable-ts
A TypeScript library for working with iterable types

[![npm version](https://badge.fury.io/js/iterable-ts.svg)](https://badge.fury.io/js/iterable-ts)
[![Build Status](https://travis-ci.org/sergey-shandar/iterable-ts.svg?branch=master)](https://travis-ci.org/sergey-shandar/iterable-ts)

See also [lazy.js](http://danieltao.com/lazy.js/).

## Iterable Type

```ts
type I<T> = Sequence<T> | () => Iterable<T> | T[];
```

## Usage

```ts
const x = [1, 2];
const y = sequence(x).flatMap(v => v * v).toArray();
```
