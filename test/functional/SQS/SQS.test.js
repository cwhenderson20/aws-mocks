import test from "ava";
import fixtures from "pow-mongodb-fixtures";
import config from "../../../lib/config";
import SQS from "../../../lib/SQS";

let db;
const QueueUrl = "https://example.com/1234/test_queue";

test.cb.before((t) => {
	db = fixtures.connect(config.db);
	db.clear(t.end);
});

test("instantiates with default options", (t) => {
	const sqs = new SQS();
	t.truthy(sqs.options);
	t.is(sqs.options.region, "us-east-1");
	t.truthy(sqs.options.params);
});

test("accepts an options argument that overrides the defaults", (t) => {
	const sqs = new SQS({ region: "us-west-1" });
	t.is(sqs.options.region, "us-west-1");
	t.truthy(sqs.options.params);
});

test("accepts bound parameters", (t) => {
	const sqs = new SQS({ params: { QueueUrl } });
	t.is(sqs.options.params.QueueUrl, QueueUrl);
});
