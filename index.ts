export type MapFunc<T, R> = (value: T, n: number) => R;

export type ReduceFunc<R, T> = (accumulator: R, value: T) => R;

export type CompareFunc<T> = (a: T, b: T) => number;

export type Entry<T> = [number, T];

export function entry<T>(v: T, i: number): Entry<T> {
    return [i, v];
}

export interface Seq<T> extends Iterable<T> {
    concat<X>(...args: X[]): Seq<T|X>;
    entries(): Iterable<Entry<T>>;
    every(callback: MapFunc<T, boolean>): boolean;
    filter(callback: MapFunc<T, boolean>): Seq<T>;
    find(callback: MapFunc<T, boolean>): T|undefined;
    findIndex(callback: MapFunc<T, boolean>): number;
    forEach(callback: MapFunc<T, void>): void;
    indexOf(searchElement: T, index?: number): number;
    join(separator?: string): string;
    keys(): Iterable<number>;
    map<R>(callback: MapFunc<T, R>): Seq<R>;
    reduce(callback: ReduceFunc<T, T>): T|undefined;
    reduce<R>(callback: ReduceFunc<R, T>, initial: R): R;
    slice(begin?: number, end?: number): Seq<T>;
    some(callback: MapFunc<T, boolean>): boolean;
    values(): Iterable<T>;
}

export interface ReadOnlyArray<T> extends Seq<T> {
    length: number;
    [i: number]: T;
    concat<X>(...args: X[]): (T|X)[];
    filter(callback: MapFunc<T, boolean>): T[];
    map<R>(callback: MapFunc<T, R>): R[];
    slice(begin?: number, end?: number): T[];
}

export class IterableSeq<T> implements Seq<T> {
    constructor(private readonly createIterator: () => Iterator<T>) {}

    [Symbol.iterator](): Iterator<T> { return this.createIterator(); }
    concat<X>(...args: X[]): IterableSeq<T|X> { return concatSeq(this, args); }
    entries(): IterableSeq<Entry<T>> { return entries(this); }
    every(f: MapFunc<T, boolean>): boolean { return every(this, f); }
    filter(f: MapFunc<T, boolean>): IterableSeq<T> { return filter(this, f); }
    find(f: MapFunc<T, boolean>): T|undefined { return find(this, f); }
    findIndex(f: MapFunc<T, boolean>): number { return findIndex(this, f); }
    forEach(f: MapFunc<T, void>): void { return forEach(this, f); }
    indexOf(s: T, index?: number): number { return indexOf(this, s, index); }
    join(separator?: string): string { return join(this, separator); }
    keys(): IterableSeq<number> { return keys(this); }
    map<R>(f: MapFunc<T, R>): IterableSeq<R> { return map(this, f); }
    reduce(callback: ReduceFunc<T, T>): T|undefined;
    reduce<R>(f: ReduceFunc<R, T>, initial: R): R;
    reduce<R>(f: ReduceFunc<R, T>, initial?: R): R|undefined { return reduce(this, f, initial); }
    slice(begin?: number, end?: number): IterableSeq<T> { return slice(this, begin, end); }
    some(f: MapFunc<T, boolean>): boolean { return some(this, f); }
    values(): IterableSeq<T> { return this; }

    concatSeq<X>(b: Seq<X>): IterableSeq<T|X> { return concatSeq(this, b); }
    drop(n: number = 1): IterableSeq<T> { return drop(this, n); }
    dropWhile(f: MapFunc<T, boolean>): IterableSeq<T> { return dropWhile(this, f); }
    first(): T|undefined { return first(this); }
    flatMap<X>(f: MapFunc<T, Seq<X>>): IterableSeq<X> { return flatMap(this, f); }
    take(n: number = 1): IterableSeq<T> { return take(this, n); }
    takeWhile(f: MapFunc<T, boolean>): IterableSeq<T> { return takeWhile(this, f); }

    toArray(): T[] {
        const result = [];
        for (const v of this) {
            result.push(v);
        }
        return result;
    }
}

export function iterableSeq<T>(f: () => Iterator<T>): IterableSeq<T> {
    return new IterableSeq(f);
}

export function values<T>(a: Seq<T>): IterableSeq<T> {
    return a instanceof IterableSeq ? a : iterableSeq(() => a[Symbol.iterator]());
}

export function seq<T>(...args: T[]): IterableSeq<T> {
    return values(args);
}

export function concatSeq<A, B>(a: Seq<A>, b: Seq<B>): IterableSeq<A|B> {
    function *result() {
        yield *a;
        yield *b;
    }
    return iterableSeq(result);
}

export function drop<T>(x: Seq<T>, n: number = 1): IterableSeq<T> {
    return dropWhile(x, (_, i) => i < n);
}

export function dropWhile<T>(x: Seq<T>, f: MapFunc<T, boolean>): IterableSeq<T> {
    function *result() {
        let drop = true;
        for (const [i, v] of entries(x)) {
            drop = drop && f(v, i);
            if (!drop) yield v;
        }
    }
    return iterableSeq(result);
}

export function entries<T>(x: Seq<T>): IterableSeq<Entry<T>> {
    return map(x, entry);
}

export function every<T>(x: Seq<T>, f: MapFunc<T, boolean>): boolean {
    return !some(x, (v, i) => !f(v, i));
}

export function filter<T>(x: Seq<T>, f: MapFunc<T, boolean>): IterableSeq<T> {
    function *result() {
        for (const [i, v] of entries(x)) {
            if (f(v, i)) {
                yield v;
            }
        }
    }
    return iterableSeq(result);
}

export function find<T>(x: Seq<T>, f: MapFunc<T, boolean>): T|undefined {
    return first(filter(x, f));
}

export function findIndex<T>(x: Seq<T>, f: MapFunc<T, boolean>): number {
    const e = find(entries(x), e => f(e[1], e[0]));
    return e === undefined ? -1 : e[0];
}

export function first<T>(x: Seq<T>): T|undefined {
    for (const v of x) {
        return v;
    }
    return undefined;
}

export function flatMap<T, R>(x: Seq<T>, f: MapFunc<T, Seq<R>>): IterableSeq<R> {
    function *result() {
        for (const [i, v] of entries(x)) {
            yield *f(v, i);
        }
    }
    return iterableSeq(result);
}

export function forEach<T>(x: Seq<T>, f: MapFunc<T, void>): void {
    for (const [i, v] of entries(x)) {
        f(v, i);
    }
}

export function indexOf<T>(x: Seq<T>, s: T, index?: number): number {
    index = index === undefined ? 0 : index;
    return findIndex(x, (v, i) => index <= i && v === s);
}

export function join<T>(x: Seq<T>, s?: string): string {
    s = s === undefined ? "" : s;
    const result = map(x, String).reduce((r, v) => r + s + v);
    return result === undefined ? "" : result;
}

export function keys<T>(x: Seq<T>): IterableSeq<number> {
    return map(x, (_, i) => i);
}

export function map<T, R>(x: Seq<T>, f: MapFunc<T, R>): IterableSeq<R> {
    function *result() {
        let i = 0;
        for (const v of x) {
            yield f(v, i);
            ++i;
        }
    }
    return iterableSeq(result);
}

export function reduce<T>(x: Seq<T>, f: ReduceFunc<T, T>): T|undefined;

export function reduce<T, R>(x: Seq<T>, f: ReduceFunc<R, T>, initial: R): R;

export function reduce<T, R>(x: Seq<T>, f: ReduceFunc<R, T>, initial?: R): R|undefined {
    for (const v of x) {
        initial = initial === undefined ? <R> <any> v : f(initial, v);
    }
    return initial;
}

export function slice<T>(x: Seq<T>, begin?: number, end?: number): IterableSeq<T> {
    const prefix = end === undefined ? values(x) : take(x, end);
    return begin === undefined ? prefix : drop(prefix, begin);
}

export function some<T>(x: Seq<T>, f: MapFunc<T, boolean>): boolean {
    return find(x, f) !== undefined;
}

export function take<T>(x: Seq<T>, n: number = 1): IterableSeq<T> {
    return takeWhile(x, (_, i) => i < n);
}

export function takeWhile<T>(x: Seq<T>, f: MapFunc<T, boolean>): IterableSeq<T> {
    function *result() {
        for (const [i, v] of entries(x)) {
            if (!f(v, i)) break;
            yield v;
        }
    }
    return iterableSeq(result);
}

export function range(end: number): IterableSeq<number>;

export function range(start: number, end: number): IterableSeq<number>;

export function range(start: number, end?: number): IterableSeq<number> {
    if (end === undefined) {
        end = start;
        start = 0;
    }
    function *result() {
        for (let i = start; i < end; ++i) {
            yield i;
        }
    }
    return iterableSeq(result);
}
