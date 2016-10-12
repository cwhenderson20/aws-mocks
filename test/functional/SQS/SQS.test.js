"use strict";

const test = require("ava");
const fixtures = require("pow-mongodb-fixtures");
const mocksConfig = require("../../../lib/mocksConfig");
const SQS = require("../../../lib/SQS");

const QueueUrl = "https://example.com/1234/test_queue";
let db;

test.cb.before((t) => {
	db = fixtures.connect(mocksConfig.db);
	db.clear(t.end);
});

test("instantiates with default options", (t) => {
	const sqs = new SQS();
	t.truthy(sqs.config);
});

// TODO: this tst doesn't make much sense anymore since we don't instantiate
//       with any default options
//
// test("accepts an options argument that overrides the defaults", (t) => {
// 	const sqs = new SQS({ region: "us-west-1" });
// 	t.is(sqs.config.region, "us-west-1");
// 	t.truthy(sqs.options.params);
// });

test("accepts bound parameters", (t) => {
	const sqs = new SQS({ params: { QueueUrl } });
	t.is(sqs.config.params.QueueUrl, QueueUrl);
});
