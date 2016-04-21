import test from "ava";
import SQS from "../../../lib/SQS";
import { MissingRequiredParameterError } from "../../../lib/AWSErrors";

const QueueUrl = "https://example.com/1234/test_queue";

test.before(() => {
	SQS.__Rewire__("connectToQueue", function (queueUrl, callback) {
		const queue = {
			ack(receiptHandle, cb) {
				setImmediate(() => cb(null, {}));
			}
		};

		setImmediate(() => callback(null, { queue, settings: {} }));
	});
});

test.cb("requires a ReceiptHandle", (t) => {
	const sqs = new SQS({ params: { QueueUrl } });

	sqs.deleteMessage((err) => {
		t.truthy(err);
		t.is(err.code, new MissingRequiredParameterError().code);
		t.end();
	});
});

test.cb("requires a QueueUrl", (t) => {
	const sqs = new SQS({ params: { ReceiptHandle: "fake" } });

	sqs.deleteMessage((err) => {
		t.truthy(err);
		t.is(err.code, new MissingRequiredParameterError().code);
		t.end();
	});
});

test.cb("deletes a message from the queue and returns an empty object", (t) => {
	const sqs = new SQS({ params: { QueueUrl, ReceiptHandle: "fake" } });

	sqs.deleteMessage((err, data) => {
		t.falsy(err);
		t.is(typeof data, "object");
		t.is(Object.keys(data).length, 0);
		t.end();
	});
});
