"use strict";

const crypto = require("crypto");
const test = require("ava");
const rewire = require("rewire");
const sinon = require("sinon");
const ObjectId = require("mongodb").ObjectId;
const AWSErrors = require("../../../lib/AWSErrors");

const SQS = rewire("../../../lib/SQS");
const QueueUrl = "https://example.com/1234/test_queue";
const MissingRequiredParameterError = AWSErrors.MissingRequiredParameterError;
let clock;

test.before(() => {
	SQS.__set__("connectToQueue", (queueUrl, callback) => { // eslint-disable-line no-underscore-dangle
		const queue = {
			get(opts, cb) {
				const record = {
					id: new ObjectId().toHexString(),
					ack: crypto.randomBytes(16).toString("hex"),
					tries: 1,
					firstClaimed: new Date().toISOString(),
					payload: { key: "value" },
				};

				setImmediate(() => cb(null, record));
			},
		};

		setImmediate(() => callback(null, { queue, settings: {} }));
	});

	clock = sinon.useFakeTimers();
});

test.afterEach(() => {
	clock.restore();
});

test.cb("requires a QueueUrl", (t) => {
	const sqs = new SQS();

	sqs.receiveMessage((err) => {
		t.truthy(err);
		t.is(err.code, new MissingRequiredParameterError().code);
		t.end();
	});
});

test.cb("adds a message to the queue and returns info", (t) => {
	const sqs = new SQS({ params: { QueueUrl } });

	sqs.receiveMessage((err, data) => {
		t.falsy(err);
		t.truthy(data);
		t.truthy(data.Messages);
		t.is(data.Messages.length, 1);
		t.truthy(data.Messages[0].MessageId);
		t.truthy(data.Messages[0].ReceiptHandle);
		t.end();
	});
});


// TODO: not sure that these test what they should be testing; also,
//       I'm not sure that WaitTimeSeconds functions the way it does in
//       the real SQS
//
// test.cb("calls setTimeout if WaitTimeSeconds is supplied", (t) => {
// 	const sqs = new SQS({ params: { QueueUrl, WaitTimeSeconds: 1 } });

// 	sqs.receiveMessage(() => {
// 		clock.tick(1000);
// 		t.end();
// 	});
// });

// test.cb("does not call setTimeout if WaitTimeSeconds is not supplied", (t) => {
// 	global.setTimeout = () => {
// 		t.fail("setTimeout should not be called");
// 		t.end();
// 	};
// 	const sqs = new SQS({ params: { QueueUrl } });
// 	sqs.receiveMessage(() => {
// 		t.pass("setTimeout was not called");
// 		t.end();
// 	});
// });
