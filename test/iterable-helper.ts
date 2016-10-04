import * as chai from "chai";
import * as iterable from "../index";

chai.should();

export function iterableEqual<T>(a: iterable.I<T>, b: iterable.I<T>) {
    iterable.sequence(a).toArray().should.deep.equal(iterable.sequence(b).toArray());
}