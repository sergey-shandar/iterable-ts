import * as chai from "chai";
import * as iterable from "../index";

chai.should();

export function iterableEqual<T>(a: iterable.I<T>, b: iterable.I<T>) {
    const aArray = iterable.sequence(a).toArray();
    const bArray = iterable.sequence(b).toArray();
    aArray.should.deep.equal(bArray);
}