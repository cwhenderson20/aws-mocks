"use strict";

const test = require("ava");
const fixtures = require("pow-mongodb-fixtures");
const mocksConfig = require("../../../lib/mocksConfig");
const SQS = require("../../../lib/SQS");
const AWSErrors = require("../../../lib/AWSErrors");

const MissingRequiredParameterError = AWSErrors.MissingRequiredParameterError;
const QueueDoesNotExistError = AWSErrors.QueueDoesNotExistError;
const QueueUrl = "https://example.com/1234/test_queue";
let db;

test.cb.before((t) => {
	db = fixtures.connect(mocksConfig.db);
	db.clear(t.end);
});

test.cb.beforeEach((t) => {
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
		}],
	}, t.end);
});

test.cb("requires a QueueName parameter", (t) => {
	const sqs = new SQS();
	sqs.getQueueUrl((err) => {
		t.truthy(err);
		t.is(err.code, new MissingRequiredParameterError().code);
		t.end();
	});
});

test.cb("gets the url of an existing queue", (t) => {
	const sqs = new SQS({ params: { QueueName: QueueUrl.split("/").slice(-1).pop() } });
	sqs.getQueueUrl((err, data) => {
		t.falsy(err);
		t.is(data.QueueUrl, QueueUrl);
		t.end();
	});
});

test.cb("does not get the url of a non-existent queue", (t) => {
	const sqs = new SQS({ params: { QueueName: "fake" } });
	sqs.getQueueUrl((err, data) => {
		t.truthy(err);
		t.is(err.code, new QueueDoesNotExistError().code);
		t.falsy(data);
		t.end();
	});
});
