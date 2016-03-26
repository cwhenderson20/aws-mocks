import crypto from "crypto";
import { assert } from "chai";
import { MongoClient } from "mongodb";
import fixtures from "pow-mongodb-fixtures";
import config from "../lib/config";
import SQS from "../lib/SQS";
import { MissingRequiredParameterError, MultipleValidationErrors, QueueDoesNotExistError } from "../lib/AWSErrors";

describe("SQS", function () {
	let db;
	let rawDb;
	const QueueUrl = "https://example.com/1234/test_queue";

	before(function (done) {
		db = fixtures.connect(config.db);
		connect((err, database) => {
			if (err) {
				throw err;
			}

			rawDb = database;
			done();
		});
	});

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
		before(function (done) {
			db.clear(done);
		});

		it("requires a MessageBody and QueueUrl", function (done) {
			const sqs = new SQS({ params: { QueueUrl, MessageBody: "test" } });
			const sqs2 = new SQS({ params: { MessageBody: "test" } });

			sqs.sendMessage((err, data) => {
				assert.notOk(err);
				assert.strictEqual(data.MD5OfMessageBody, md5("test"));

				sqs2.sendMessage((err) => {
					assert.ok(err);
					assert.strictEqual(err.code, new MissingRequiredParameterError().code);
					done();
				});
			});
		});
	});

	describe("listQueues", function () {
		it("finds all queues when no filter is provided", function (done) {
			const sqs = new SQS();
			sqs.listQueues((err, data) => {
				assert.notOk(err);
				assert.ok(data);
				done();
			});
		});

		it("only finds queues with a given prefix when QueueNamePrefix is provided", function (done) {
			const sqs = new SQS({ params: { QueueNamePrefix: "test" } });
			sqs.listQueues((err, data) => {
				assert.notOk(err);
				assert.isArray(data.QueueUrls);
				assert.strictEqual(data.QueueUrls.length, 1);
				done();
			});
		});
	});

	describe("setQueueAttributes", function () {
		beforeEach(function (done) {
			db.clearAndLoad({
				queue_settings: [{
					Name: QueueUrl.split("/").slice(-1).pop(),
					URL: QueueUrl,
					Created: new Date().toISOString(),
					DelaySeconds: 0,
					MaxMessageSize: 0,
					MessageRetentionPeriod: 0,
					ReceiveMessageWaitTimeSeconds: 0,
					VisibilityTimeout: 0
				}]
			}, done);
		});

		it("requires QueueUrl and Attributes params", function (done) {
			const sqs = new SQS();
			sqs.setQueueAttributes((err) => {
				assert.ok(err);
				assert.strictEqual(err.code, new MultipleValidationErrors([]).code);
				done();
			});
		});

		it("sets queue attributes on an existing queue", function (done) {
			const sqs = new SQS({
				params: {
					QueueUrl,
					Attributes: {
						DelaySeconds: 1000,
						MaxMessageSize: 1000,
						MessageRetentionPeriod: 1000,
						ReceiveMessageWaitTimeSeconds: 1000,
						VisibilityTimeout: 1000
					}
				}
			});

			sqs.setQueueAttributes((err) => {
				assert.notOk(err);
				rawDb.collection("queue_settings").findOne({ URL: QueueUrl }, (err, data) => {
					assert.notOk(err);
					assert.strictEqual(data.DelaySeconds, 1000);
					assert.strictEqual(data.MaxMessageSize, 1000);
					assert.strictEqual(data.MessageRetentionPeriod, 1000);
					assert.strictEqual(data.ReceiveMessageWaitTimeSeconds, 1000);
					assert.strictEqual(data.VisibilityTimeout, 1000);
					done();
				});
			});
		});

		it("does not act on non-existent queues", function (done) {
			const sqs = new SQS({
				params: {
					QueueUrl: "fakeURL",
					Attributes: {
						DelaySeconds: 1000,
						MaxMessageSize: 1000,
						MessageRetentionPeriod: 1000,
						ReceiveMessageWaitTimeSeconds: 1000,
						VisibilityTimeout: 1000
					}
				}
			});

			sqs.setQueueAttributes((err) => {
				assert.notOk(err);
				rawDb.collection("queue_settings").findOne({ URL: "fake" }, (err, data) => {
					assert.notOk(err);
					assert.strictEqual(data, null);
					done();
				});
			});
		});
	});

	describe("getQueueUrl", function () {
		beforeEach(function (done) {
			db.clearAndLoad({
				queue_settings: [{
					Name: QueueUrl.split("/").slice(-1).pop(),
					URL: QueueUrl,
					Created: new Date().toISOString(),
					DelaySeconds: 0,
					MaxMessageSize: 0,
					MessageRetentionPeriod: 0,
					ReceiveMessageWaitTimeSeconds: 0,
					VisibilityTimeout: 0
				}]
			}, done);
		});

		it("requires a QueueName parameter", function (done) {
			const sqs = new SQS();
			sqs.getQueueUrl((err) => {
				assert.ok(err);
				assert.strictEqual(err.code, new MissingRequiredParameterError().code);
				done();
			});
		});

		it("gets the url of an existing queue", function (done) {
			const sqs = new SQS({ params: { QueueName: QueueUrl.split("/").slice(-1).pop() } });
			sqs.getQueueUrl((err, data) => {
				assert.notOk(err);
				assert.strictEqual(data.QueueUrl, QueueUrl);
				done();
			});
		});

		it("does not get the url of a non-existent queue", function (done) {
			const sqs = new SQS({ params: { QueueName: "fake" } });
			sqs.getQueueUrl((err, data) => {
				assert.ok(err);
				assert.strictEqual(err.code, new QueueDoesNotExistError().code);
				assert.notOk(data);
				done();
			});
		});
	});
});

function md5(body) {
	return crypto.createHash("md5").update(body).digest("hex");
}

function connect(cb) {
	MongoClient.connect(config.db, cb);
}
