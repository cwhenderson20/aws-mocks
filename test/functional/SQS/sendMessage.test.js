"use strict";

const crypto = require("crypto");
const test = require("ava");
const fixtures = require("pow-mongodb-fixtures");
const SQS = require("../../../lib/SQS");
const config = require("../../../lib/config");
const { MissingRequiredParameterError } = require("../../../lib/AWSErrors");

let db;
const QueueUrl = "https://example.com/1234/test_queue";

test.before(() => {
	db = fixtures.connect(config.db);
	db.clear();
});

test("requires a MessageBody and QueueUrl", (t) => {
	const sqs = new SQS({ params: { QueueUrl, MessageBody: "test" } });
	const sqs2 = new SQS({ params: { MessageBody: "test" } });

	sqs.sendMessage((err, data) => {
		t.falsy(err);
		t.is(data.MD5OfMessageBody, md5("test"));

		sqs2.sendMessage((err) => {
			t.truthy(err);
			t.is(err.code, new MissingRequiredParameterError().code);
			t.end();
		});
	});
});

function md5(body) {
	return crypto.createHash("md5").update(body).digest("hex");
}
