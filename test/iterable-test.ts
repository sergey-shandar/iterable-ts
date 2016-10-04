import "mocha";
import * as iterable from "../index";
import * as chai from "chai";
import { iterableEqual } from "./iterable-helper";

chai.should();

describe("class Sequence", () => {
    it("flatMap()", () => {
        function *x() { yield 1; yield 4; }
        iterableEqual(iterable.sequence(x).flatMap(v => [v, v]), [1, 1, 4, 4]);
    });
});

it("concat()", () => {
    function *x() { yield 1; yield 3; }
    iterableEqual(iterable.concat(x, x), [1, 3, 1, 3]);
    iterableEqual(
        iterable.concat(iterable.sequence(x), iterable.sequence(x)), [1, 3, 1, 3]);
    const m = [9, 7];
    iterableEqual(iterable.concat(m, m), [9, 7, 9, 7]);
});

it("compact()", () => {
    iterableEqual(iterable.compact([0, 1, false, 2, '', 3]), [1, 2, 3]);
})

it("drop()", () => {
    iterableEqual(iterable.drop([1, 2, 3]), [2, 3]);
    iterableEqual(iterable.drop([1, 2, 3], 2), [3]);
    iterableEqual(iterable.drop([1, 2, 3], 5), []);
    iterableEqual(iterable.drop([1, 2, 3], 0), [1, 2, 3]);
})
it("join()", () => {
    iterable.join(['a', 'b', 'c'], '~').should.equal("a~b~c");
    iterable.join([], '~').should.equal("");
})
it("flatten()", () => {
    function *x() { yield 1; yield 4; }
    iterableEqual(iterable.flatten([x, x]), [ 1, 4, 1, 4]);
});
it("min()", () => {
    chai.assert.equal(iterable.min([4, 2, 8, 6]), 2);
    chai.assert.equal(iterable.min([]), undefined);
});
it("max()", () => {
    chai.assert.equal(iterable.max([4, 2, 8, 6]), 8);
    chai.assert.equal(iterable.max([]), undefined);
});
it("sum()", () => {
    iterable.sum([4, 2, 8, 6]).should.equal(20);
    iterable.sum([]).should.equal(0);
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

    const a = iterable.sequence(x).toArray();
    counter.should.equal(1);
    a.should.deep.equal([1, 2]);

    const b = iterable.sequence(x).toArray();
    counter.should.equal(1);
    b.should.equal(a);

    iterableEqual(iterable.sequence(x).map(v => v * v), [1, 4]);
    counter.should.equal(1);
});
it("range()", () => iterableEqual(iterable.range(10, 15), [10, 11, 12, 13, 14]));
it("product()", () => {
    iterableEqual(iterable.product([1, 2], [10, 20], (a, b) => [a + b]), [11, 21, 12, 22]);
});
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