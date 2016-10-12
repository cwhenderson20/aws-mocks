"use strict";

const test = require("ava");
const AWSError = require("../../../lib/AWSErrors").AWSError;

test("is a subclass of Error", (t) => {
	t.truthy(new AWSError() instanceof Error);
});

test("accepts a message parameter", (t) => {
	const error = new AWSError("message");
	t.is(error.message, "message");
});

test("automatically generates a timestamp", (t) => {
	const error = new AWSError("message");
	t.truthy(error.time);
	t.truthy(new Date(error.time) instanceof Date);
});
