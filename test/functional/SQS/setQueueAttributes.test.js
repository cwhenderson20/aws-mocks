"use strict";

const test = require("ava");
const MongoClient = require("mongodb").MongoClient;
const fixtures = require("pow-mongodb-fixtures");
const mocksConfig = require("../../../lib/mocksConfig");
const SQS = require("../../../lib/SQS");
const AWSErrors = require("../../../lib/AWSErrors");

const QueueUrl = "https://example.com/1234/test_queue";
const MultipleValidationErrors = AWSErrors.MultipleValidationErrors;
let rawDb;
let db;

test.cb.before((t) => {
	db = fixtures.connect(mocksConfig.db);
	connect((err, database) => {
		if (err) {
			throw err;
		}

		rawDb = database;
		t.end();
	});
});

test.cb.beforeEach((t) => {
	db.clearAndLoad({
		queue_settings: [{
			Name: QueueUrl.split("/").slice(-1).pop(),
			URL: QueueUrl,
			Created: new Date().toISOString(),
			DelaySeconds: 0,
			MaximumMessageSize: 0,
			MessageRetentionPeriod: 0,
			ReceiveMessageWaitTimeSeconds: 0,
			VisibilityTimeout: 0,
		}],
	}, t.end);
});

test.cb("requires QueueUrl and Attributes params", (t) => {
	const sqs = new SQS();
	sqs.setQueueAttributes((err) => {
		t.truthy(err);
		t.is(err.code, new MultipleValidationErrors([]).code);
		t.end();
	});
});

test.cb("sets queue attributes on an existing queue", (t) => {
	const sqs = new SQS({
		params: {
			QueueUrl,
			Attributes: {
				DelaySeconds: 1000,
				MaximumMessageSize: 1000,
				MessageRetentionPeriod: 1000,
				ReceiveMessageWaitTimeSeconds: 1000,
				VisibilityTimeout: 1000,
			},
		},
	});

	sqs.setQueueAttributes((err) => {
		t.falsy(err);
		rawDb.collection("queue_settings").findOne({ URL: QueueUrl }, (err, data) => {
			t.falsy(err);
			t.is(data.DelaySeconds, 1000);
			t.is(data.MaximumMessageSize, 1000);
			t.is(data.MessageRetentionPeriod, 1000);
			t.is(data.ReceiveMessageWaitTimeSeconds, 1000);
			t.is(data.VisibilityTimeout, 1000);
			t.end();
		});
	});
});

test.cb("does not act on non-existent queues", (t) => {
	const sqs = new SQS({
		params: {
			QueueUrl: "fakeURL",
			Attributes: {
				DelaySeconds: 1000,
				MaximumMessageSize: 1000,
				MessageRetentionPeriod: 1000,
				ReceiveMessageWaitTimeSeconds: 1000,
				VisibilityTimeout: 1000,
			},
		},
	});

	sqs.setQueueAttributes((err) => {
		t.falsy(err);
		rawDb.collection("queue_settings").findOne({ URL: "fake" }, (err, data) => {
			t.falsy(err);
			t.is(data, null);
			t.end();
		});
	});
});

function connect(cb) {
	MongoClient.connect(mocksConfig.db, cb);
}
