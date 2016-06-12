import crypto from "crypto";
import test from "ava";
import { ObjectId } from "mongodb";
import SQS from "../../../lib/SQS";
import { MissingRequiredParameterError } from "../../../lib/AWSErrors";

const QueueUrl = "https://example.com/1234/test_queue";

test.before(() => {
	SQS.__Rewire__("connectToQueue", function (queueUrl, callback) {
		const queue = {
			get(opts, cb) {
				const record = {
					id: new ObjectId().toHexString(),
					ack: crypto.randomBytes(16).toString("hex"),
					tries: 1,
					firstClaimed: new Date().toISOString(),
					payload: { key: "value" }
				};

				setImmediate(() => cb(null, record));
			}
		};

		setImmediate(() => callback(null, { queue, settings: {} }));
	});
});

test.cb("requires a QueueUrl", (t) => {
	const sqs = new SQS();

	sqs.receiveMessage((err) => {
		t.truthy(err);
		t.is(err.code, new MissingRequiredParameterError().code);
		t.end();
	});
});

test.cb("adds a message to the queue and returns info", (t) => {
	const sqs = new SQS({ params: { QueueUrl } });

	sqs.receiveMessage((err, data) => {
		t.falsy(err);
		t.truthy(data);
		t.truthy(data.Messages);
		t.is(data.Messages.length, 1);
		t.truthy(data.Messages[0].MessageId);
		t.truthy(data.Messages[0].ReceiptHandle);
		t.end();
	});
});

test.cb("calls setTimeout if WaitTimeSeconds is supplied", (t) => {
	global.setTimeout = function () { t.pass("setTimeout was called"); t.end(); }
	const sqs = new SQS({ params: {QueueUrl, WaitTimeSeconds: 1 } });
	sqs.receiveMessage((err) => {
		t.fail("setTimeout should have been called");
		t.end();
	});
});

test.cb("does not call setTimeout if WaitTimeSeconds is not supplied", (t) => {
	global.setTimeout = () => {t.fail("setTimeout should not be called"); t.end(); }
	const sqs = new SQS({ params: {QueueUrl} });
	sqs.receiveMessage((err) => {
		t.pass("setTimeout was not called");
		t.end();
	});
});