import test from "ava";
import SQS from "../../../lib/SQS";

const QueueUrl = "https://example.com/1234/test_queue";

test.cb("requires a QueueUrl", (t) => {
	const sqs = new SQS();
	const sqs2 = new SQS({ params: { QueueUrl } });

	sqs.receiveMessage((err) => {
		t.truthy(err);
		sqs2.receiveMessage((innerErr) => {
			t.falsy(innerErr);
			t.end();
		});
	});
});
