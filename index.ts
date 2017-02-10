import "tslib";

export type MapFunc<T, R> = (value: T) => R;

export type ReduceFunc<R, T> = (accumulator: R|undefined, value: T) => R;

export type CompareFunc<T> = (a: T, b: T) => number;

export type Entry<T> = [number, T];

export interface Seq<T> {
    [Symbol.iterator](): IterableIterator<T>;
    concat<X>(...args: X[]): Seq<T|X>;
    entries(): IterableIterator<Entry<T>>;
    every(callback: MapFunc<T, boolean>): boolean;
    filter(callback: MapFunc<T, boolean>): Seq<T>;
    find(callback: MapFunc<T, boolean>): T|undefined;
    findIndex(callback: MapFunc<T, boolean>): number;
    forEach(callback: MapFunc<T, void>): void;
    indexOf(searchElement: T, index?: number): number;
    join(separator?: string): string;
    keys(): IterableIterator<number>;
    map<R>(callback: MapFunc<T, R>): Seq<R>;
    reduce(callback: ReduceFunc<T, T>): T|undefined;
    reduce<R>(callback: ReduceFunc<R, T>, initial: R): R;
    slice(begin?: number, end?: number): Seq<T>;
    some(callback: MapFunc<T, boolean>): boolean;
    values(): IterableIterator<T>;
}

export class IteratorSeq<T> implements Seq<T> {

    constructor(private readonly createIterator: () => IterableIterator<T>) { }

    [Symbol.iterator](): IterableIterator<T> { return this.createIterator(); }

    concat<X>(...args: X[]): Seq<T|X> { return concat(this, args); }

    *entries(): IterableIterator<[number, T]> {
        let i = 0;
        for (const v of this) {
            yield [i, v];
            ++i;
        }
    }

    every(callback: MapFunc<T, boolean>): boolean {
        return !this.some(v => !callback(v));
    }

    filter(callback: MapFunc<T, boolean>): Seq<T> {
        return flatMap(this, v => callback(v) ? [v] : []);
    }

    find(callback: MapFunc<T, boolean>): T|undefined {
        return first(this.filter(callback));
    }

    private findIndexInEntries(callback: MapFunc<Entry<T>, boolean>): number {
        return getIndex(entries(this).find(callback));
    }

    findIndex(callback: MapFunc<T, boolean>): number {
        return this.findIndexInEntries(e => callback(e[1]));
    }

    forEach(callback: MapFunc<T, void>): void {
        for (const v of this) {
            callback(v);
        }
    }

    indexOf(searchElement: T, index?: number): number {
        index = index === undefined ? 0 : index;
        return this.findIndexInEntries(v => index <= v[0] && v[1] === searchElement);
    }

    join(separator?: string): string {
        return this.map(String).reduce((a, b) => a + separator + b, "");
    }

    keys(): IterableIterator<number> {
        return entries(this).map(v => v[0]).values();
    }

    map<R>(callback: MapFunc<T, R>): Seq<R> {
        return flatMap(this, v => [callback(v)]);
    }

    slice(begin?: number, end?: number): Seq<T> {
        const x = this;
        function *result() {
            for (const [index, value] of x.entries()) {
                if (end !== undefined && end < index) {
                    break;
                }
                if (begin === undefined || begin <= index) {
                    yield value;
                }
            }
        }
        return seq(result);
    }

    some(callback: MapFunc<T, boolean>): boolean {
        return this.find(callback) !== undefined;
    }

    reduce<R>(callback: ReduceFunc<R, T>, initial: R): R;
    reduce(callback: ReduceFunc<T, T>): T|undefined;

    reduce<R>(callback: ReduceFunc<R, T>, initial?: R): R|undefined {
        for (const v of this) {
            initial = initial === undefined ? <any> v : callback(initial, v);
        }
        return initial;
    }

    values(): IterableIterator<T> {
        return this.createIterator();
    }
}

export function getIndex<T>(e: Entry<T>|undefined) {
    return e !== undefined ? e[0] : -1;
}

export function seq<T>(createIterator: () => IterableIterator<T>): Seq<T> {
    return new IteratorSeq(createIterator);
}

export function concat<A, B>(a: Seq<A>, b: Seq<B>): Seq<A|B> {
    function *result() {
        yield *a;
        yield *b;
    }
    return seq(result);
}

export function entries<T>(x: Seq<T>): Seq<Entry<T>> {
    return seq(x.entries);
}

export function first<T>(x: Seq<T>): T|undefined {
    for (const v of x) {
        return v;
    }
    return undefined;
}

export function flatMap<T, R>(x: Seq<T>, callback: MapFunc<T, Seq<R>>) {
    function *result() {
        for (const value of x) {
            yield *callback(value);
        }
    }
    return seq(result);
}

export function take<T>(x: Seq<T>, n: number = 1): Seq<T> {
    return takeWhile(entries(x), v => v[0] < n).map(v => v[1]);
}

export function takeWhile<T>(x: Seq<T>, f: MapFunc<T, boolean>): Seq<T> {
    function *result() {
        for (const v of x) {
            if (!f(v)) break;
            yield v;
        }
    }
    return seq(result);
}

export interface ReadOnlyArray<T> extends Seq<T> {
    length: number;
    [i: number]: T;
    concat<X>(...args: X[]): (T|X)[];
    filter(callback: MapFunc<T, boolean>): T[];
    map<R>(callback: MapFunc<T, R>): R[];
    slice(begin?: number, end?: number): T[];
}

export const x: ReadOnlyArray<string> = [ "xxx" ];
