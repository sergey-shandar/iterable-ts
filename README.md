# iterable-ts
A TypeScript library for working with iterable types

[![npm version](https://badge.fury.io/js/iterable-ts.svg)](https://badge.fury.io/js/iterable-ts)
[![Build Status](https://travis-ci.org/sergey-shandar/iterable-ts.svg?branch=master)](https://travis-ci.org/sergey-shandar/iterable-ts)

See also [lazy.js](http://danieltao.com/lazy.js/), [
ECMAScript This-Binding Syntax Proposal](https://github.com/tc39/proposal-bind-operator).

## Iterable Type

```ts
type I<T> = Sequence<T> | () => Iterable<T> | T[];
```

## Usage

```ts
const x = [1, 2];
const y = sequence(x).flatMap(v => v * v).toArraySequence();
const z = array(1, 2).filter(v => v != 2);
```
