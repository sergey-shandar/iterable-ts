import "mocha";
import * as iterable from "../index";
import * as chai from "chai";
import { iterableEqual } from "./iterable-helper";

chai.should();

describe("namespace iterable", function () {
    it("concat()", () => {
        function *x() { yield 1; yield 3; }
        iterableEqual(iterable.concat(x, x), [1, 3, 1, 3]);
        iterableEqual(
            iterable.concat(iterable.stateless(x), iterable.stateless(x)), [1, 3, 1, 3]);
        const m = [9, 7];
        iterableEqual(iterable.concat(m, m), [9, 7, 9, 7]);
    });
    it("flatMap()", () => {
        function *x() { yield 1; yield 4; }
        iterableEqual(iterable.flatMap(x, v => [v, v]), [1, 1, 4, 4]);
    });
    it("flatten()", () => {
        function *x() { yield 1; yield 4; }
        iterableEqual(iterable.flatten([x, x]), [ 1, 4, 1, 4]);
    });
    it("identity()", () => iterableEqual(iterable.flatMapIdentity(5), [5]));
    it("groupBy()", () => {
        const m = iterable.groupBy([ "a", "b", "x", "b" ], k => k, (a, b) => a + b);
        m.should.deep.equal({ "a": "a", "b": "bb", "x": "x" });
    });
    it("values()", () => iterableEqual(iterable.values({ a: "x", b: "c"}), ["x", "c"]));
    it("forEach()", () => {
        const i = [ 1, 2, 3 ];
        const x: string[] = [];
        iterable.forEach(i, v => x.push(v.toString()));
        x.should.deep.equal(["1", "2", "3"]);
    });
    it("cache()", () => {
        let counter = 0;
        function *result() {
            yield 1;
            yield 2;
            ++counter;
        }
        const x = iterable.cache(result);
        counter.should.equal(0);

        const a = iterable.toArray(x);
        counter.should.equal(1);
        a.should.deep.equal([1, 2]);

        const b = iterable.toArray(x);
        counter.should.equal(1);
        b.should.equal(a);

        iterableEqual(iterable.map(x, v => v * v), [1, 4]);
        counter.should.equal(1);
    });
    it("range()", () => iterableEqual(iterable.range(10, 15), [10, 11, 12, 13, 14]));
    describe("namespace async", function() {
        it("forEach()", async () => {
            let result = 0;
            await iterable.async.forEach(iterable.range(0, 100), v => result += v);
            result.should.equal(99 * 100 / 2);
        });
        it("groupBy()", async () => {
            const m = await iterable.async.groupBy([ "a", "b", "x", "b" ], k => k, (a, b) => a + b);
            m.should.deep.equal({ "a": "a", "b": "bb", "x": "x" });
        });
    });
});