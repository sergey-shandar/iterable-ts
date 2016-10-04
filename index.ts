import "tslib";

export function lazy<T>(f: () => T): () => T {
    let called = false;
    let result: T;
    return () => {
        if (!called) {
            result = f();
            called = true;
        }
        return result;
    };
}

export function immediate(): Promise<void> {
    return new Promise(resolve => setImmediate(resolve));
}

export abstract class Sequence<T> implements Iterable<T> {

    abstract toArray(): T[];

    abstract [Symbol.iterator](): Iterator<T>;
}

class FromArray<T> extends Sequence<T> {
    constructor(private readonly _array: T[]) { super(); }

    toArray() { return this._array; }
    [Symbol.iterator]() { return this._array[Symbol.iterator](); }
}

class FromIterator<T> extends Sequence<T> {
    constructor(private readonly _f: () => Iterator<T>) { super(); }

    toArray() { return Array.from(this); }
    [Symbol.iterator]() { return this._f(); }
}

class Cache<T> extends Sequence<T> {
    private _getArray: () => T[];

    constructor(i: I<T>) {
        super();
        this._getArray = lazy(() => toArray(i));
    }

    toArray() { return this._getArray(); }
    [Symbol.iterator]() { return this._getArray()[Symbol.iterator](); }
}

export type I<T> = Sequence<T> | (() => IterableIterator<T>) | T[];

export function sequence<T>(i: I<T>): Sequence<T> {
    if (i instanceof Sequence) {
        return i;
    } else if (i instanceof Array) {
        return new FromArray(i);
    } else {
        return new FromIterator(i);
    }
}

export function toArray<T>(i: I<T>): T[] {
    return sequence(i).toArray();
}

export function cache<T>(a: I<T>): I<T> {
    return new Cache(a);
}

export type FlatMapFunc<T, O> = (value: T) => I<O>;

export function flatMapIdentity<T>(value: T): I<T> {
    return [value];
}

export function flatMap<T, R>(a: I<T>, f: FlatMapFunc<T, R>): I<R> {
    const s = sequence(a);
    function *result() {
        for (const cv of s) {
            yield* sequence(f(cv));
        }
    }
    return sequence(result);
}

export type MapFunc<T, R> = (value: T) => R;

export function map<T, R>(a: I<T>, f: MapFunc<T, R>): I<R> {
    return flatMap(a, x => [f(x)]);
}

export function concat<T>(a: I<T>, b: I<T>): I<T> {
    const sa = sequence(a);
    const sb = sequence(b);
    function *result() {
        yield *sa;
        yield *sb;
    }
    return sequence(result);
}

export function flatten<T>(c: I<I<T>>): I<T> {
    return flatMap(c, v => v);
}

export type FilterFunc<T> = MapFunc<T, boolean>;

export function filterFuncToFlatMapFunc<T>(filterFunc: FilterFunc<T>): FlatMapFunc<T, T> {
    return value => filterFunc(value) ? [value] : [];
}

export function filter<T>(c: I<T>, f: MapFunc<T, boolean>): I<T> {
    return flatMap(c, filterFuncToFlatMapFunc(f));
}

export function compact<T>(c: I<T>): I<T> {
    return filter(c, Boolean);
}

export class WithIndex<T> {
    constructor(public readonly value: T, public readonly index: number) {}
}

export function withIndex<T>(c: I<T>): I<WithIndex<T>> {
    const s = sequence(c);
    function *result() {
        let i = 0;
        for (const v of s) {
            yield new WithIndex(v, i);
            ++i;
        }
    }
    return sequence(result);
}

export function drop<T>(c: I<T>, n: number = 1): I<T> {
    return map(filter(withIndex(c), v => v.index >= n), v => v.value);
}

export function reduce<T>(c: I<T>, r: ReduceFunc<T>): T|undefined {
    let result: T|undefined = undefined;
    forEach(c, v => {
        result = result === undefined ? v : r(result, v);
    });
    return result;
}

export function join(c: I<string>, s: string = ","): string {
    return reduce(c, (a, b) => a + s + b) || "";
}

export function min(c: I<number>): number|undefined {
    return reduce(c, (a, b) => a < b ? a : b);
}

export function max(c: I<number>): number|undefined {
    return reduce(c, (a, b) => a > b ? a : b);
}

export function sum(c: I<number>): number {
    return reduce(c, (a, b) => a + b) || 0;
}

export function forEach<T>(c: I<T>, f: (v: T) => void): void {
    for (const v of sequence(c)) {
        f(v);
    }
}

export type KeyFunc<T> = (value: T) => string;

export type ReduceFunc<T> = (a: T, b: T) => T;

export type ProductFunc<A, B, O> = (a: A, b: B) => I<O>;

export interface Map<T> {
    [id: string]: T;
}

export function keys<T>(m: Map<T>): I<string> {
    function *result() {
        for (const k in m) {
            yield k;
        }
    }
    return sequence(result);
}

export function values<T>(m: Map<T>): I<T> {
    return map(keys(m), k => m[k]);
}

class GroupBy<T> {
    readonly map: Map<T> = {};
    constructor(
        private readonly _key: KeyFunc<T>,
        private readonly _reduce: ReduceFunc<T>) {}
    add(v: T): void {
        const k = this._key(v);
        const old = this.map[k];
        this.map[k] = old === undefined ? v : this._reduce(old, v);
    }
}

export function groupBy<T>(c: I<T>, key: KeyFunc<T>, reduce: ReduceFunc<T>): Map<T> {
    const result = new GroupBy(key, reduce);
    forEach(c, v => result.add(v));
    return result.map;
}

export function product<A, B, R>(a: I<A>, b: I<B>, f: ProductFunc<A, B, R>): I<R> {
    return flatMap(a, av => flatMap(b, bv => f(av, bv)));
}

export function range(a: number, b: number): I<number> {
    function *result() {
        for (let i = a; i < b; ++i) {
            yield i;
        }
    }
    return sequence(result);
}

export namespace async {
    export async function forEach<T>(c: I<T>, f: (v: T) => void): Promise<void> {
        for (const v of sequence(c)) {
            f(v);
            await immediate();
        }
    }

    export async function groupBy<T>(
        c: I<T>, key: KeyFunc<T>, reduce: ReduceFunc<T>): Promise<Map<T>> {

        const result = new GroupBy<T>(key, reduce);
        await forEach(c, v => result.add(v));
        return result.map;
    }
}