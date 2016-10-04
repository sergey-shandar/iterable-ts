import "mocha";
import * as iterable from "../index";
import * as chai from "chai";
import { iterableEqual } from "./iterable-helper";

chai.should();

describe("class Sequence", () => {
    it("asyncForEach()", async () => {
        let result = 0;
        await iterable.range(0, 100).asyncForEach(v => result += v);
        result.should.equal(99 * 100 / 2);
    });
    it("asyncGroupBy()", async () => {
        const m = await iterable
            .sequence([ "a", "b", "x", "b" ])
            .asyncGroupBy(k => k, (a, b) => a + b);
        m.should.deep.equal({ "a": "a", "b": "bb", "x": "x" });
    });
    it("concat()", () => {
        function *x() { yield 1; yield 3; }
        iterableEqual(iterable.sequence(x).concat(x), [1, 3, 1, 3]);
        iterableEqual(
            iterable.sequence(x).concat(iterable.sequence(x)), [1, 3, 1, 3]);
        const m = [9, 7];
        iterableEqual(iterable.sequence(m).concat(m), [9, 7, 9, 7]);
    });
    it("compact()", () => {
        iterableEqual(
            iterable.sequence([0, 1, false, 2, '', 3]).compact(), [1, 2, 3]);
    })
    it("drop()", () => {
        iterableEqual(iterable.sequence([1, 2, 3]).drop(), [2, 3]);
        iterableEqual(iterable.sequence([1, 2, 3]).drop(2), [3]);
        iterableEqual(iterable.sequence([1, 2, 3]).drop(5), []);
        iterableEqual(iterable.sequence([1, 2, 3]).drop(0), [1, 2, 3]);
    })
    it("forEach()", () => {
        const i = [ 1, 2, 3 ];
        const x: string[] = [];
        iterable.sequence(i).forEach(v => x.push(v.toString()));
        x.should.deep.equal(["1", "2", "3"]);
    });
    it("flatMap()", () => {
        function *x() { yield 1; yield 4; }
        iterableEqual(iterable.sequence(x).flatMap(v => [v, v]), [1, 1, 4, 4]);
    });
    it("groupBy()", () => {
        const m = iterable
            .sequence([ "a", "b", "x", "b" ])
            .groupBy(k => k, (a, b) => a + b);
        m.should.deep.equal({ "a": "a", "b": "bb", "x": "x" });
    });
    it("product()", () => {
        iterableEqual(
            iterable.sequence([1, 2]).product([10, 20], (a, b) => [a + b]),
            [11, 21, 12, 22]);
    });
    it("size()", () => {
        iterable.array().size().should.equal(0);
        iterable.array("sss", "eee").size().should.equal(2);
        function *x() { yield 1; yield 3; }
        iterable.sequence(x).size().should.equal(2);
    })
    it("get()", () => {
        chai.assert.isUndefined(iterable.array().get(1));
        (<string> iterable.array("sss", "eee").get(1)).should.equal("eee");
        function *x() { yield 1; yield 3; }
        (<number> iterable.sequence(x).get(0)).should.equal(1);
        (<number> iterable.sequence(x).get(1)).should.equal(3);
        chai.assert.isUndefined(iterable.sequence(x).get(2));
    })
});

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
it("values()", () => iterableEqual(iterable.values({ a: "x", b: "c"}), ["x", "c"]));
it("lazyArray()", () => {
    let counter = 0;
    function *result() {
        yield 1;
        yield 2;
        ++counter;
    }
    const x = iterable.lazyArray(result);
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
it("productFuncS()", () => {
    function product(a: number, b: number): number[] {
        return [a, b];
    }
    iterableEqual(iterable.productFuncS(product)(1, 2), [1, 2]);
});