import test from "ava";
import SQS from "../../../lib/SQS";
import { MissingRequiredParameterError, InvalidParameterValueError } from "../../../lib/AWSErrors";

const QueueUrl = "https://example.com/1234/test_queue";

test.before(() => {
	SQS.__Rewire__("connectToQueue", function (queueUrl, callback) {
		const queue = {
			col: {
				findOneAndUpdate: (query, update, cb) => {
					setImmediate(() => cb(null, {}));
				}
			}
		};

		setImmediate(() => callback(null, { queue, settings: {} }));
	});
});

test.cb("requires a ReceiptHandle", (t) => {
	const sqs = new SQS({ params: { QueueUrl, VisibilityTimeout: 10 } });

	sqs.changeMessageVisibility((err) => {
		t.truthy(err);
		t.is(err.code, new MissingRequiredParameterError().code);
		t.end();
	});
});

test.cb("requires a QueueUrl", (t) => {
	const sqs = new SQS({ params: { VisibilityTimeout: 10, ReceiptHandle: "fake" } });

	sqs.changeMessageVisibility((err) => {
		t.truthy(err);
		t.is(err.code, new MissingRequiredParameterError().code);
		t.end();
	});
});

test.cb("requires a VisibilityTimeout", (t) => {
	const sqs = new SQS({ params: { QueueUrl, ReceiptHandle: "fake" } });

	sqs.changeMessageVisibility((err) => {
		t.truthy(err);
		t.is(err.code, new MissingRequiredParameterError().code);
		t.end();
	});
});

test.cb("does not allow extending message visibility past 12 hours", (t) => {
	const sqs = new SQS({ params: { QueueUrl, ReceiptHandle: "fake", VisibilityTimeout: 43201 }});

	sqs.changeMessageVisibility((err) => {
		t.truthy(err);
		t.is(err.code, new InvalidParameterValueError().code);
		t.end();
	});
});

test.cb("extends a message's visibility and returns an empty object", (t) => {
	const sqs = new SQS({ params: { QueueUrl, ReceiptHandle: "fake", VisibilityTimeout: 100 } });

	sqs.changeMessageVisibility((err, data) => {
		t.falsy(err);
		t.is(typeof data, "object");
		t.is(Object.keys(data).length, 0);
		t.end();
	});
});
