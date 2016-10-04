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

    async asyncForEach(f: (v: T) => void): Promise<void> {
        for (const v of this) {
            f(v);
            await immediate();
        }
    }

    async asyncGroupBy(key: KeyFunc<T>, reduce: ReduceFunc<T>):
        Promise<Map<T>> {

        const result = new GroupBy<T>(key, reduce);
        await this.asyncForEach(v => result.add(v));
        return result.map;
    }

    compact(): Sequence<T> {
        return this.filter(Boolean);
    }

    concat(b: I<T>): Sequence<T> {
        const sa = this;
        const sb = sequence(b);
        function *result() {
            yield *sa;
            yield *sb;
        }
        return sequence(result);
    }

    drop(n: number = 1): Sequence<T> {
        return this.withIndex().filter(v => v.index >= n).map(v => v.value);
    }

    filter(f: MapFunc<T, boolean>): Sequence<T> {
        return this.flatMap(filterFuncToFlatMapFunc(f));
    }

    forEach(f: (v: T) => void): void {
        for (const v of this) {
            f(v);
        }
    }

    flatMap<R>(f: FlatMapFunc<T, R>): Sequence<R> {
        const a = this;
        function *result() {
            for (const cv of a) {
                yield* sequence(f(cv));
            }
        }
        return sequence(result);
    }

    groupBy(key: KeyFunc<T>, reduce: ReduceFunc<T>): Map<T> {
        const result = new GroupBy(key, reduce);
        this.forEach(v => result.add(v));
        return result.map;
    }

    map<R>(f: MapFunc<T, R>): Sequence<R> {
        return this.flatMap(x => [f(x)]);
    }

    product<B, R>(b: I<B>, f: ProductFunc<T, B, R>): I<R> {
        const bs = sequence(b);
        return this.flatMap(av => bs.flatMap(bv => f(av, bv)));
    }

    reduce(r: ReduceFunc<T>): T|undefined {
        let result: T|undefined = undefined;
        this.forEach(v => {
            result = result === undefined ? v : r(result, v);
        });
        return result;
    }

    withIndex(): Sequence<WithIndex<T>> {
        const s = this;
        function *result() {
            let i = 0;
            for (const v of s) {
                yield new WithIndex(v, i);
                ++i;
            }
        }
        return sequence(result);
    }
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
        this._getArray = lazy(() => sequence(i).toArray());
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

export function cache<T>(a: I<T>): I<T> {
    return new Cache(a);
}

export type FlatMapFunc<T, O> = (value: T) => I<O>;

export function flatMapIdentity<T>(value: T): I<T> {
    return [value];
}

export type MapFunc<T, R> = (value: T) => R;

export function flatten<T>(c: I<I<T>>): Sequence<T> {
    return sequence<I<T>>(c).flatMap(v => v);
}

export type FilterFunc<T> = MapFunc<T, boolean>;

export function filterFuncToFlatMapFunc<T>(filterFunc: FilterFunc<T>): FlatMapFunc<T, T> {
    return value => filterFunc(value) ? [value] : [];
}

export class WithIndex<T> {
    constructor(public readonly value: T, public readonly index: number) {}
}

export function join(c: I<string>, s: string = ","): string {
    return sequence(c).reduce((a, b) => a + s + b) || "";
}

export function min(c: I<number>): number|undefined {
    return sequence(c).reduce((a, b) => a < b ? a : b);
}

export function max(c: I<number>): number|undefined {
    return sequence(c).reduce((a, b) => a > b ? a : b);
}

export function sum(c: I<number>): number {
    return sequence(c).reduce((a, b) => a + b) || 0;
}

export type KeyFunc<T> = (value: T) => string;

export type ReduceFunc<T> = (a: T, b: T) => T;

export type ProductFunc<A, B, O> = (a: A, b: B) => I<O>;

export interface Map<T> {
    [id: string]: T;
}

export function keys<T>(m: Map<T>): Sequence<string> {
    function *result() {
        for (const k in m) {
            yield k;
        }
    }
    return sequence(result);
}

export function values<T>(m: Map<T>): Sequence<T> {
    return sequence(keys(m)).map(k => m[k]);
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

export function range(a: number, b: number): Sequence<number> {
    function *result() {
        for (let i = a; i < b; ++i) {
            yield i;
        }
    }
    return sequence(result);
}

export namespace async {
}