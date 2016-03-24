import { assert } from "chai";
import SQS from "../lib/SQS";

describe("SQS", function () {
	let sqs;

	beforeEach(() => sqs = new SQS());

	it("has methods", () => {
		assert.ok(sqs.receiveMessage);
	});
});
