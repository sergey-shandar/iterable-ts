import "ts-helpers";

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

export abstract class Stateless<T> implements Iterable<T> {

    abstract toArray(): T[];

    abstract [Symbol.iterator](): Iterator<T>;
}

class FromArray<T> extends Stateless<T> {
    constructor(private readonly _array: T[]) { super(); }

    toArray() { return this._array; }
    [Symbol.iterator]() { return this._array[Symbol.iterator](); }
}

class FromIterator<T> extends Stateless<T> {
    constructor(private readonly _f: () => Iterator<T>) { super(); }

    toArray() { return Array.from(this); }
    [Symbol.iterator]() { return this._f(); }
}

class Cache<T> extends Stateless<T> {
    private _getArray: () => T[];

    constructor(i: I<T>) {
        super();
        this._getArray = lazy(() => toArray(i));
    }

    toArray() { return this._getArray(); }
    [Symbol.iterator]() { return this._getArray()[Symbol.iterator](); }
}

export type I<T> = Stateless<T> | (() => IterableIterator<T>) | T[];

export function stateless<T>(i: I<T>): Stateless<T> {
    if (i instanceof Stateless) {
        return i;
    } else if (i instanceof Array) {
        return new FromArray(i);
    } else {
        return new FromIterator(i);
    }
}

export function toArray<T>(i: I<T>): T[] {
    return stateless(i).toArray();
}

export function cache<T>(a: I<T>): I<T> {
    return new Cache(a);
}

export type FlatMapFunc<T, O> = (value: T) => I<O>;

export function flatMapIdentity<T>(value: T): I<T> {
    return [value];
}

export function flatMap<T, R>(a: I<T>, f: FlatMapFunc<T, R>): I<R> {
    function *result() {
        for (const cv of stateless(a)) {
            yield* stateless(f(cv));
        }
    }
    return stateless(result);
}

export type FlatFunc<T, R> = (value: T) => R;

export function map<T, R>(a: I<T>, f: FlatFunc<T, R>): I<R> {
    return flatMap(a, x => [f(x)]);
}

export function concat<T>(a: I<T>, b: I<T>): I<T> {
    function *result() {
        yield *stateless(a);
        yield *stateless(b);
    }
    return stateless(result);
}

export function flatten<T>(c: I<I<T>>): I<T> {
    return flatMap(c, v => v);
}

export function forEach<T>(c: I<T>, f: (v: T) => void): void {
    for (const v of stateless(c)) {
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
    return stateless(result);
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
    return stateless(result);
}

export namespace async {
    export async function forEach<T>(c: I<T>, f: (v: T) => void): Promise<void> {
        for (const v of stateless(c)) {
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