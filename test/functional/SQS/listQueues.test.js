"use strict";

const test = require("ava");
const fixtures = require("pow-mongodb-fixtures");
const mocksConfig = require("../../../lib/mocksConfig");
const SQS = require("../../../lib/SQS");

const QueueUrl = "https://example.com/1234/test_queue";
const QueueUrl2 = "https://example.com/1234/fake_queue";
let db;

test.cb.before((t) => {
	db = fixtures.connect(mocksConfig.db);
	db.clearAndLoad({
		queue_settings: [{
			Name: QueueUrl.split("/").slice(-1).pop(),
			URL: QueueUrl,
			Created: new Date().toISOString(),
			DelaySeconds: 0,
			MaxMessageSize: 0,
			MessageRetentionPeriod: 0,
			ReceiveMessageWaitTimeSeconds: 0,
			VisibilityTimeout: 0,
		}, {
			Name: QueueUrl2.split("/").slice(-1).pop(),
			URL: QueueUrl2,
			Created: new Date().toISOString(),
			DelaySeconds: 0,
			MaxMessageSize: 0,
			MessageRetentionPeriod: 0,
			ReceiveMessageWaitTimeSeconds: 0,
			VisibilityTimeout: 0,
		}],
	}, t.end);
});

test.cb("finds all queues when no filter is provided", (t) => {
	const sqs = new SQS();
	sqs.listQueues((err, data) => {
		t.falsy(err);
		t.truthy(data);
		t.is(data.QueueUrls.length, 2);
		t.end();
	});
});

test.cb("only finds queues with a given prefix when QueueNamePrefix is provided", (t) => {
	const sqs = new SQS({ params: { QueueNamePrefix: "test" } });
	sqs.listQueues((err, data) => {
		t.falsy(err);
		t.truthy(Array.isArray(data.QueueUrls));
		t.is(data.QueueUrls.length, 1);
		t.end();
	});
});
