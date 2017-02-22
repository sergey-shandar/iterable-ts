export type MapFunc<T, R> = (value: T, n: number) => R;

export type ReduceFunc<R, T> = (accumulator: R, value: T) => R;

export type CompareFunc<T> = (a: T, b: T) => number;

export type Entry<T> = [number, T];

export interface Map<T> {
    [key: string]: T
};

export interface ReadOnlyMap<T> {
    readonly [key: string]: T
};

export function entry<T>(v: T, i: number): Entry<T> {
    return [i, v];
}

export interface ArrayIterable<T> extends Iterable<T> {
    concat<X>(...args: X[][]): ArrayIterable<T|X>;
    entries(): Iterable<Entry<T>>;
    every(callback: MapFunc<T, boolean>): boolean;
    filter(callback: MapFunc<T, boolean>): ArrayIterable<T>;
    find(callback: MapFunc<T, boolean>): T|undefined;
    findIndex(callback: MapFunc<T, boolean>): number;
    forEach(callback: MapFunc<T, void>): void;
    indexOf(searchElement: T, index?: number): number;
    join(separator?: string): string;
    keys(): Iterable<number>;
    map<R>(callback: MapFunc<T, R>): ArrayIterable<R>;
    reduce(callback: ReduceFunc<T, T>): T|undefined;
    reduce<R>(callback: ReduceFunc<R, T>, initial: R): R;
    slice(begin?: number, end?: number): ArrayIterable<T>;
    some(callback: MapFunc<T, boolean>): boolean;
    values(): Iterable<T>;
}

export interface ReadOnlyArray<T> extends ArrayIterable<T> {
    readonly length: number;
    readonly [i: number]: T;
    concat<X>(...args: X[][]): (T|X)[];
    filter(callback: MapFunc<T, boolean>): T[];
    map<R>(callback: MapFunc<T, R>): R[];
    slice(begin?: number, end?: number): T[];
}

export class IterableEx<T> implements ArrayIterable<T> {
    constructor(private readonly createIterator: () => Iterator<T>) {}

    [Symbol.iterator](): Iterator<T> { return this.createIterator(); }
    concat<X>(...args: ArrayIterable<X>[]): IterableEx<T|X> { return concat(this, ...args); }
    entries(): IterableEx<Entry<T>> { return entries(this); }
    every(f: MapFunc<T, boolean>): boolean { return every(this, f); }
    filter(f: MapFunc<T, boolean>): IterableEx<T> { return filter(this, f); }
    find(f: MapFunc<T, boolean>): T|undefined { return find(this, f); }
    findIndex(f: MapFunc<T, boolean>): number { return findIndex(this, f); }
    forEach(f: MapFunc<T, void>): void { return forEach(this, f); }
    indexOf(s: T, index?: number): number { return indexOf(this, s, index); }
    join(separator?: string): string { return join(this, separator); }
    keys(): IterableEx<number> { return keys(this); }
    map<R>(f: MapFunc<T, R>): IterableEx<R> { return map(this, f); }
    reduce(callback: ReduceFunc<T, T>): T|undefined;
    reduce<R>(f: ReduceFunc<R, T>, initial: R): R;
    reduce<R>(f: ReduceFunc<R, T>, initial?: R): R|undefined { return reduce(this, f, initial); }
    slice(begin?: number, end?: number): IterableEx<T> { return slice(this, begin, end); }
    some(f: MapFunc<T, boolean>): boolean { return some(this, f); }
    values(): IterableEx<T> { return this; }

    drop(n: number = 1): IterableEx<T> { return drop(this, n); }
    dropWhile(f: MapFunc<T, boolean>): IterableEx<T> { return dropWhile(this, f); }
    first(): T|undefined { return first(this); }
    flatMap<X>(f: MapFunc<T, ArrayIterable<X>>): IterableEx<X> { return flatMap(this, f); }
    groupBy(k: MapFunc<T, string>): Map<T[]> { return groupBy(this, k); }
    groupReduce(k: MapFunc<T, string>, r: (c: T, v: T) => T): Map<T>;
    groupReduce<R>(k: MapFunc<T, string>, r: (c: R, v: T) => R, initial: R): Map<R>;
    groupReduce<R>(k: MapFunc<T, string>, r: (c: R, v: T) => R, initial?: R): Map<R> {
        return groupReduce(this, k, r, <R> initial);
    }
    product<B, R>(b: ArrayIterable<B>, f: (a: T, b: B) => R): IterableEx<R> {
        return product(this, b, f);
    }
    take(n: number = 1): IterableEx<T> { return take(this, n); }
    takeWhile(f: MapFunc<T, boolean>): IterableEx<T> { return takeWhile(this, f); }

    toArray(): T[] {
        const result = [];
        for (const v of this) {
            result.push(v);
        }
        return result;
    }
}

export function iterableEx<T>(f: () => Iterator<T>): IterableEx<T> {
    return new IterableEx(f);
}

export function ex<T>(a: Iterable<T>): IterableEx<T> {
    return iterableEx(() => a[Symbol.iterator]());
}

export function chain<T>(a: ArrayIterable<T>): IterableEx<T> {
    return a instanceof IterableEx ? a : ex(a);
}

export function seq<T>(...args: T[]): IterableEx<T> {
    return ex(args);
}

export function concat<A, B>(a: ArrayIterable<A>, ...bs: ArrayIterable<B>[]): IterableEx<A|B> {
    function *result() {
        yield *a;
        for (const b of bs) {
            yield *b;
        }
    }
    return iterableEx(result);
}

export function drop<T>(x: ArrayIterable<T>, n: number = 1): IterableEx<T> {
    return dropWhile(x, (_, i) => i < n);
}

export function dropWhile<T>(x: ArrayIterable<T>, f: MapFunc<T, boolean>): IterableEx<T> {
    function *result() {
        let drop = true;
        for (const [i, v] of entries(x)) {
            drop = drop && f(v, i);
            if (!drop) yield v;
        }
    }
    return iterableEx(result);
}

export function entries<T>(x: ArrayIterable<T>): IterableEx<Entry<T>> {
    return map(x, entry);
}

export function every<T>(x: ArrayIterable<T>, f: MapFunc<T, boolean>): boolean {
    return !some(x, (v, i) => !f(v, i));
}

export function filter<T>(x: ArrayIterable<T>, f: MapFunc<T, boolean>): IterableEx<T> {
    function *result() {
        for (const [i, v] of entries(x)) {
            if (f(v, i)) {
                yield v;
            }
        }
    }
    return iterableEx(result);
}

export function find<T>(x: ArrayIterable<T>, f: MapFunc<T, boolean>): T|undefined {
    return first(filter(x, f));
}

export function findIndex<T>(x: ArrayIterable<T>, f: MapFunc<T, boolean>): number {
    const e = find(entries(x), e => f(e[1], e[0]));
    return e === undefined ? -1 : e[0];
}

export function first<T>(x: ArrayIterable<T>): T|undefined {
    for (const v of x) {
        return v;
    }
    return undefined;
}

export function flatMap<T, R>(x: ArrayIterable<T>, f: MapFunc<T, ArrayIterable<R>>): IterableEx<R> {
    function *result() {
        for (const [i, v] of entries(x)) {
            yield *f(v, i);
        }
    }
    return iterableEx(result);
}

export function forEach<T>(x: ArrayIterable<T>, f: MapFunc<T, void>): void {
    for (const [i, v] of entries(x)) {
        f(v, i);
    }
}

export function indexOf<T>(x: ArrayIterable<T>, s: T, index?: number): number {
    index = index === undefined ? 0 : index;
    return findIndex(x, (v, i) => index <= i && v === s);
}

export function join<T>(x: ArrayIterable<T>, s?: string): string {
    s = s === undefined ? "" : s;
    const result = map(x, String).reduce((r, v) => r + s + v);
    return result === undefined ? "" : result;
}

export function keys<T>(x: ArrayIterable<T>): IterableEx<number> {
    return map(x, (_, i) => i);
}

export function map<T, R>(x: ArrayIterable<T>, f: MapFunc<T, R>): IterableEx<R> {
    function *result() {
        let i = 0;
        for (const v of x) {
            yield f(v, i);
            ++i;
        }
    }
    return iterableEx(result);
}

export function reduce<T>(x: ArrayIterable<T>, f: ReduceFunc<T, T>): T|undefined;

export function reduce<T, R>(x: ArrayIterable<T>, f: ReduceFunc<R, T>, initial: R): R;

export function reduce<T, R>(x: ArrayIterable<T>, f: ReduceFunc<R, T>, initial?: R): R|undefined {
    for (const v of x) {
        initial = initial === undefined ? <R> <any> v : f(initial, v);
    }
    return initial;
}

export function slice<T>(x: ArrayIterable<T>, begin?: number, end?: number): IterableEx<T> {
    const prefix = end === undefined ? chain(x) : take(x, end);
    return begin === undefined ? prefix : drop(prefix, begin);
}

export function some<T>(x: ArrayIterable<T>, f: MapFunc<T, boolean>): boolean {
    return find(x, f) !== undefined;
}

export function take<T>(x: ArrayIterable<T>, n: number = 1): IterableEx<T> {
    return takeWhile(x, (_, i) => i < n);
}

export function takeWhile<T>(x: ArrayIterable<T>, f: MapFunc<T, boolean>): IterableEx<T> {
    function *result() {
        for (const [i, v] of entries(x)) {
            if (!f(v, i)) break;
            yield v;
        }
    }
    return iterableEx(result);
}

export function groupReduce<T>(
    x: ArrayIterable<T>,
    k: MapFunc<T, string>,
    r: (r: T, v: T) => T):
    Map<T>;

export function groupReduce<T, R>(
    x: ArrayIterable<T>,
    k: MapFunc<T, string>,
    r: (r: R, v: T) => R,
    intial: R):
    Map<R>;

export function groupReduce<T, R>(
    x: ArrayIterable<T>,
    k: MapFunc<T, string>,
    r: (r: R, v: T) => R,
    initial?: R):
    Map<R> {
    var result: Map<R> = {};
    x.forEach((v, i) =>{
        const key = k(v, i);
        const c = result[key];
        result[key] =
            c !== undefined ? r(c, v) :
            initial !== undefined ? r(initial, v) :
            <R> <any> v;
    });
    return result;
}

export function groupBy<T>(x: ArrayIterable<T>, k: MapFunc<T, string>): Map<T[]> {
    return groupReduce(x, k, (r: T[], v) => r.concat([v]), []);
}

export function flatten<T>(s: ArrayIterable<ArrayIterable<T>>): IterableEx<T>;

export function flatten<T>(s: ArrayIterable<IterableEx<T>>): IterableEx<T>;

export function flatten<T>(s: ArrayIterable<ArrayIterable<T>>): IterableEx<T> {
    return flatMap(s, v => v);
}

export function product<A, B, R>(a: ArrayIterable<A>, b: ArrayIterable<B>, f: (a: A, b: B) => R):
    IterableEx<R> {

    function *result() {
        for (const va of a) {
            for (const vb of b) {
                yield f(va, vb);
            }
        }
    }
    return iterableEx(result);
}

export function range(end: number): IterableEx<number>;

export function range(start: number, end: number): IterableEx<number>;

export function range(start: number, end?: number): IterableEx<number> {
    if (end === undefined) {
        end = start;
        start = 0;
    }
    function *result() {
        for (let i = start; i < end; ++i) {
            yield i;
        }
    }
    return iterableEx(result);
}

export function values<T>(map: ReadOnlyMap<T>): IterableEx<T> {
    function *result(): Iterator<T> {
        for (var key in map) {
            yield map[key];
        }
    }
    return iterableEx(result);
}