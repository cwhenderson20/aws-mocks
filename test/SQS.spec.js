import crypto from "crypto";
import { assert } from "chai";
import SQS from "../lib/SQS";

describe("SQS", function () {
	const QueueUrl = "http://test.com/1234/testQueue";

	it("instantiates with default options", function () {
		const sqs = new SQS();
		assert.ok(sqs.options);
		assert.strictEqual(sqs.options.region, "us-east-1");
		assert.ok(sqs.options.params);
	});

	it("accepts an options argument that overrides the defaults", function () {
		const sqs = new SQS({ region: "us-west-1" });
		assert.strictEqual(sqs.options.region, "us-west-1");
		assert.ok(sqs.options.params);
	});

	it("accepts bound parameters", function () {
		const sqs = new SQS({ params: { QueueUrl } });
		assert.strictEqual(sqs.options.params.QueueUrl, QueueUrl);
	});

	describe("receiveMessage", function () {
		it("requires a QueueUrl", function (done) {
			const sqs = new SQS();
			const sqs2 = new SQS({ params: { QueueUrl } });

			sqs.receiveMessage((err) => {
				assert.ok(err);
				sqs2.receiveMessage((innerErr) => {
					assert.notOk(innerErr);
					done();
				});
			});
		});
	});

	describe("sendMessage", function () {
		it("requires a MessageBody and QueueUrl", function (done) {
			const sqs = new SQS({ params: { QueueUrl , MessageBody: "test" } });

			sqs.sendMessage((err, data) => {
				assert.notOk(err);
				assert.ok(data);
				assert.strictEqual(data.MD5OfMessageBody, md5("test"));
				done();
			});
		});
	});
});

function md5(body) {
	return crypto.createHash("md5").update(body).digest("hex");
}
