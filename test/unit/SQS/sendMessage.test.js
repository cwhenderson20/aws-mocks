import crypto from "crypto";
import test from "ava";
import SQS from "../../../lib/SQS";
import { MissingRequiredParameterError } from "../../../lib/AWSErrors";

const QueueUrl = "https://example.com/1234/test_queue";

function id() {
	return crypto.randomBytes(6).toString("hex");
}

function md5(body) {
	return crypto.createHash("md5").update(body).digest("hex");
}

test.before(() => {
	SQS.__Rewire__("connectToQueue", function (queueUrl, callback) {
		const queue = {
			add(body, opts, cb) {
				setImmediate(() => cb(null, id()));
			}
		};
		setImmediate(() => callback(null, { queue }));
	});
});

test.cb("requires a MessageBody and QueueUrl", (t) => {
	const sqs = new SQS({ params: { QueueUrl } });
	const sqs2 = new SQS({ params: { MessageBody: "test" } });

	sqs.sendMessage((err) => {
		t.truthy(err);
		t.is(err.code, new MissingRequiredParameterError().code);

		sqs2.sendMessage((err) => {
			t.truthy(err);
			t.is(err.code, new MissingRequiredParameterError().code);
			t.end();
		});
	});
});

test.cb("adds a message to the queue and returns info", (t) => {
	const sqs = new SQS({ params: { QueueUrl, MessageBody: "test" } });

	sqs.sendMessage((err, data) => {
		t.falsy(err);
		t.is(typeof data, "object");
		t.is(data.MD5OfMessageBody, md5("test"));
		t.truthy(data.MessageId);
		t.end();
	});
});
