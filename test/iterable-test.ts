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
    it("flatMap() flatten", () => {
        iterableEqual(iterable.array([5, 3], [7], [], [89]).flatMap(v => v), [5, 3, 7, 89]);
    })
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
    it("join()", () => {
        iterable.array('a', 'b', 'c').join(v => v, '~').should.equal("a~b~c");
        iterable.array<string>().join(v => v, '~').should.equal("");
    })
    it("min()", () => {
        chai.assert.equal(iterable.array(4, 2, 8, 6).min(v => v), 2);
        chai.assert.equal(iterable.array<number>().min(v => v), undefined);
    })
    it("max()", () => {
        chai.assert.equal(iterable.array(4, 2, 8, 6).max(v => v), 8);
        chai.assert.equal(iterable.array<number>().max(v => v), undefined);
    })
    it("sum()", () => {
        iterable.array(4, 2, 8, 6).sum(v => v).should.equal(20);
        iterable.array<number>().sum(v => v).should.equal(0);
    })
});
it("values()", () => iterableEqual(iterable.values({ a: "x", b: "c"}), ["x", "c"]));
it("range()", () => iterableEqual(iterable.range(10, 15), [10, 11, 12, 13, 14]));
