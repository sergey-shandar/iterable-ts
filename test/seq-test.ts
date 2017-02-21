import * as _ from "../index";
import * as chai from "chai";
import "mocha";

chai.should();

describe("class IterableSeq", () => {
    it("concat()", () => {
        _.values([1, 2, 3]).concat("a", "b", "c").toArray().should.deep.eq([1, 2, 3, "a", "b", "c"])
    })
    it("entries()", () => {
        _.values(["q", "w", "e"]).entries().toArray().should.deep.eq([[0, "q"], [1, "w"], [2, "e"]]);
    })
    it("every()", () => {
        _.seq(false, true, false).every(a => a).should.eq(false);
        _.values(<boolean[]>[true, true, true]).every(a => a).should.eq(true);
    })
    it("filter()", () => {
        _.seq(1, 2, 3).filter(x => x < 3).toArray().should.deep.eq([1, 2]);
    })
    it("find()", () => {
        chai.should().equal(_.seq(1, 2, 3).find(x => x < 3), 1);
        chai.should().equal(_.seq(1, 2, 3).find(x => x > 4), undefined);
    })
    it("findIndex()", () => {
        chai.should().equal(_.seq(1, 2, 3).findIndex(x => x > 2), 2);
        chai.should().equal(_.seq(1, 2, 3).findIndex(x => x > 4), -1);
    })
    it("forEach()", () => {
        let r = 0;
        _.seq(1, 2, 3).forEach(x => { r += x; });
        r.should.eq(6);
    })
    it("indexOf()", () => {
        _.seq("1", "2", "3").indexOf("2").should.eq(1);
        _.seq("a", "b", "c", "c").indexOf("c", 3).should.eq(3);
        _.seq("q", "w", "r").indexOf("q", 1).should.eq(-1);
    })
    it("join()", () => {
        _.seq(1, 2, 3).join(", ").should.eq("1, 2, 3");
        _.seq(1, 2, 3).join().should.eq("123");
        _.seq().join().should.eq("");
    })
    it("keys()", () => {
        _.seq("a", "2", "3").keys().toArray().should.deep.eq([0, 1, 2]);
    })
    it("map()", () => {
        _.seq(1, 2, 3).map(x => x * x).toArray().should.deep.eq([1, 4, 9]);
    })
    it("slice()", () => {
        _.seq(1, 2, 3).slice().toArray().should.deep.eq([1, 2, 3]);
        _.seq(1, 2, 3).slice(1).toArray().should.deep.eq([2, 3]);
        _.seq(1, 2, 3).slice(1, 2).toArray().should.deep.eq([2]);
    })
    it("some()", () => {
        _.seq(1, 2, 3).some(x => x == 2).should.eq(true);
        _.seq(1, 2, 3).some(x => x == 20).should.eq(false);
    })
    it("values()", () => {
        _.seq(1, 2, 3).values().toArray().should.deep.eq([1, 2, 3]);
    })
    it("concatSeq()", () => {
        _.seq(1, 2, 3).concatSeq([5, 6, 7]).toArray().should.deep.eq([1, 2, 3, 5, 6, 7]);
    })
    it("drop()", () => {
        _.seq(1, 2, 3).drop().toArray().should.deep.eq([2, 3]);
    })
    it("dropWhile()", () => {
        _.seq(1, 2, 3, 2, 1).dropWhile(x => x < 3).toArray().should.deep.eq([3, 2, 1]);
    })
    it("first()", () => {
        chai.assert.equal(_.seq(1, 2, 3).first(), 1);
        chai.assert.isUndefined(_.seq().first());
    })
    it("flatMap()", () => {
        _.seq(1, 2, 3).flatMap(x => [x, x * x]).toArray().should.deep.eq([1, 1, 2, 4, 3, 9]);
    })
    it("groupBy", () => {
        _.seq(1, 2, 3, 1, 4, 5).groupBy(String).should.deep
            .eq({ "1": [1, 1], "2": [2], "3": [3], "4": [4], "5": [5]});
    })
    it("take()", () => {
        _.seq(1, 2, 3).take().toArray().should.deep.eq([1]);
        _.seq(1, 2, 3).take(4).toArray().should.deep.eq([1, 2, 3]);
        _.seq(1, 2, 3).take(2).toArray().should.deep.eq([1, 2]);
    })
    it("takeWhile()", () => {
        _.seq(1, 2, 3).takeWhile(x => x <= 2).toArray().should.deep.eq([1, 2]);
    })
})

it("flatten()", () => {
    _.flatten(_.seq([1, 2, 3], [10], [20, 30])).toArray().should.deep.eq([1, 2, 3, 10, 20, 30]);
})

it("range()", () => {
    _.range(2, 5).toArray().should.deep.eq([2, 3, 4]);
    _.range(5).toArray().should.deep.eq([0, 1, 2, 3, 4]);
})