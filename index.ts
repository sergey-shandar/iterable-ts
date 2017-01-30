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
    return new Promise<void>(resolve => setImmediate(resolve));
}

export function defined<T>(v: T) { return v !== undefined; }

export abstract class Sequence<T> implements Iterable<T> {

    abstract toArraySequence(): ArraySequence<T>;

    abstract [Symbol.iterator](): Iterator<T>;

    /**
     * LINQ: Count()
     * LINQ: Count(f) => filter(f).size()
     */
    abstract size(): number;

    abstract nth(i: number): T|undefined;

    async asyncForEach(f: (v: T) => void): Promise<void> {
        for (const v of this) {
            f(v);
            await immediate();
        }
    }

    async asyncGroupBy<R>(key: KeyFunc<T>, map: MapFunc<T, R>, reduce: ReduceFunc<R>):
        Promise<Map<R>> {

        const result = new GroupBy(key, map, reduce);
        await this.asyncForEach(v => result.add(v));
        return result.map;
    }

    chunk(size: number = 1): Sequence<ArraySequence<T>> {
        const a = this;
        function *result() {
            let r: T[] = [];
            for (const v of a) {
                r.push(v);
                if (r.length == size) {
                    yield new ArraySequence(r);
                    r = [];
                }
            }
            if (r.length > 0) {
                yield new ArraySequence(r);
            }
        }
        return sequence(result);
    }

    compact(): Sequence<T> {
        return this.filter(Boolean);
    }

    /**
     * LINQ: Concat()
     */
    concat(bi: I<T>): Sequence<T> {
        const a = this;
        const b = sequence(bi);
        function *result() {
            yield *a;
            yield *b;
        }
        return sequence(result);
    }

    countBy(key: KeyFunc<T>): Map<number> {
        return this.groupBy(key, _ => 1, (a, b) => a + b);
    }

    /**
     * LINQ: Skip()
     */
    drop(n: number = 1): Sequence<T> {
        return this.withIndex().dropWhile(v => v.index < n).map(v => v.value);
    }

    /**
     * LINQ: SkipWhile()
     */
    dropWhile(f: MapFunc<T, boolean>): Sequence<T> {
        const a = this;
        function *result() {
            var drop = true;
            for (const v of a) {
                drop = drop && f(v);
                if (!drop) yield v;
            }
        }
        return sequence(result);
    }

    /**
     * forEach()
     */
    each(f: (v: T) => void): void {
        for (const v of this) {
            f(v);
        }
    }

    /**
     * LINQ: All()
     */
    every(f: MapFunc<T, boolean> = defined): boolean {
        return !this.some(v => !f(v));
    }

    /**
     * LINQ: Where()
     */
    filter(f: MapFunc<T, boolean>): Sequence<T> {
        return this.flatMap(filterFuncToFlatMapFunc(f));
    }

    /**
     * LINQ: First()
     */
    find(f: MapFunc<T, boolean>): T|undefined {
        return this.filter(f).first();
    }

    /**
     * LINQ: Last()
     */
    findLast(f: MapFunc<T, boolean>): T|undefined {
        return this.filter(f).last();
    }

    /**
     * LINQ: First()
     */
    first(): T|undefined {
        return this.nth(0);
    }

    /**
     * LINQ: SelectMany()
     */
    flatMap<R>(f: FlatMapFunc<T, R>): Sequence<R> {
        const a = this;
        function *result() {
            for (const cv of a) {
                yield* sequence(f(cv));
            }
        }
        return sequence(result);
    }

    readonly forEach = this.each;

    /**
     * LINQ: GroupBy()
     */
    groupBy<R>(key: KeyFunc<T>, map: MapFunc<T, R>, reduce: ReduceFunc<R>): Map<R> {
        const result = new GroupBy(key, map, reduce);
        this.forEach(v => result.add(v));
        return result.map;
    }

    readonly head = this.first;

    /**
     * All but last.
     */
    initial(): Sequence<T> {
        const x = this;
        function *result() {
            let prior: T|undefined = undefined;
            for (const v of x) {
                if (prior !== undefined) {
                    yield prior;
                }
                prior = v;
            }
        }
        return sequence(result);
    }

    /**
     * LINQ: string.Join()
     */
    join(toString: MapFunc<T, string>, s: string = ","): string {
        return this.map(toString).reduce((a, b) => a + s + b) || "";
    }

    /**
     * LINQ: Select()
     */
    map<R>(f: MapFunc<T, R>): Sequence<R> {
        return this.flatMap(x => [f(x)]);
    }

    /**
     * LINQ: Max()
     */
    max(toNumber: MapFunc<T, number>): number|undefined {
        return this.map(toNumber).reduce((a, b) => a > b ? a : b);
    }

    maxBy(less: (a: T, b: T) => boolean): T|undefined {
        return this.minBy((a, b) => less(b, a));
    }

    /**
     * LINQ: Min()
     */
    min(toNumber: MapFunc<T, number>): number|undefined {
        return this.map(toNumber).reduce((a, b) => a < b ? a : b);
    }

    minBy(less: (a: T, b: T) => boolean): T|undefined {
        return this.reduce((a, b) => less(b, a) ? b : a);
    }

    /**
     * LINQ: Last()
     */
    last(): T|undefined {
        return this.reduce((_, b) => b);
    }

    /**
     * complexity is N^2.
     *
     * LINQ: OrderBy()
     */
    orderBy(less: (a:T, b: T) => boolean): Sequence<T> {
        const x = this;
        function *result() {
            let min = x.minBy(less);
            while (min !== undefined) {
                const oldMin = min;
                min = undefined;
                for (const v of x) {
                    if (!less(v, oldMin)) {
                        if (!less(oldMin, v)) {
                            yield v;
                        } else if (min === undefined || less(v, min)) {
                            min = v;
                        }
                    }
                }
            }
        }
        return sequence(result);
    }

    product<B, R>(b: I<B>, f: ProductFunc<T, B, R>): Sequence<R> {
        const bs = sequence(b);
        return this.flatMap(av => bs.flatMap(bv => f(av, bv)));
    }

    /**
     * LINQ: Aggregate()
     */
    reduce(r: ReduceFunc<T>): T|undefined {
        let result: T|undefined = undefined;
        this.forEach(v => {
            result = result === undefined ? v : r(result, v);
        });
        return result;
    }

    /**
     * LINQ: Any()
     */
    some(f: MapFunc<T, boolean> = defined): boolean {
        return defined(this.filter(f).first());
    }

    /**
     * LINQ: Sum()
     */
    sum(toNumber: (v: T) => number): number {
        return this.map(toNumber).reduce((a, b) => a + b) || 0;
    }

    readonly tail = this.drop;

    /**
     * LINQ: Take()
     */
    take(n: number = 1): Sequence<T> {
        return this.withIndex().takeWhile(x => x.index < n).map(x => x.value);
    }

    /**
     * LINQ: TakeWhile()
     */
    takeWhile(f: MapFunc<T, boolean>): Sequence<T> {
        const a = this;
        function *result() {
            for (const v of a) {
                if (!f(v)) break;
                yield v;
            }
        }
        return sequence(result);
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

export class ArraySequence<T> extends Sequence<T> {

    constructor(public readonly raw: T[]) { super(); }

    toArraySequence() { return this; }

    [Symbol.iterator]() { return this.raw[Symbol.iterator](); }

    size() { return this.raw.length; }

    nth(i: number) { return this.raw[i]; }
}

class IteratorSequence<T> extends Sequence<T> {

    constructor(private readonly _f: () => Iterator<T>) { super(); }

    toArraySequence() { return new ArraySequence(Array.from(this)); }

    [Symbol.iterator]() { return this._f(); }

    size() { return this.sum(() => 1); }

    nth(i: number) {
        for (const v of this) {
            if (i === 0) {
                return v;
            }
            --i;
        }
        return undefined;
    }
}

export type I<T> = Sequence<T> | (() => IterableIterator<T>) | T[];

export function sequence<T>(i: I<T>): Sequence<T> {
    if (i instanceof Sequence) {
        return i;
    } else if (i instanceof Array) {
        return new ArraySequence(i);
    } else {
        return new IteratorSequence(i);
    }
}

export function array<T>(...a: T[]): ArraySequence<T> {
    return new ArraySequence(a);
}

export type FlatMapFunc<T, O> = (value: T) => I<O>;

export type MapFunc<T, R> = (value: T) => R;

export type FilterFunc<T> = MapFunc<T, boolean>;

export function filterFuncToFlatMapFunc<T>(filterFunc: FilterFunc<T>): FlatMapFunc<T, T> {
    return value => filterFunc(value) ? array(value) : array<T>();
}

export class WithIndex<T> {
    constructor(public readonly value: T, public readonly index: number) {}
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
    return keys(m).map(k => m[k]);
}

class GroupBy<T, R> {
    readonly map: Map<R> = {};
    constructor(
        private readonly _key: KeyFunc<T>,
        private readonly _map: MapFunc<T, R>,
        private readonly _reduce: ReduceFunc<R>) {}
    add(v: T): void {
        const k = this._key(v);
        const r = this._map(v);
        const old = this.map[k];
        this.map[k] = old === undefined ? r : this._reduce(old, r);
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

export function fill<T>(size: number, v: T): Sequence<T> {
    return range(0, size).map(() => v);
}
