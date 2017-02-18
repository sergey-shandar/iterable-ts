# iterable-ts
A TypeScript library for working with iterable types

[![npm version](https://badge.fury.io/js/iterable-ts.svg)](https://badge.fury.io/js/iterable-ts)
[![Build Status](https://travis-ci.org/sergey-shandar/iterable-ts.svg?branch=master)](https://travis-ci.org/sergey-shandar/iterable-ts)

See also [lazy.js](http://danieltao.com/lazy.js/), [
ECMAScript This-Binding Syntax Proposal](https://github.com/tc39/proposal-bind-operator).

## Usage

```ts
import { seq, values } from "iterable-ts";

const y = seq(1, 2).flatMap(v => v * v).toArray();
const z = values([1, 2]).filter(v => v != 2);
```
