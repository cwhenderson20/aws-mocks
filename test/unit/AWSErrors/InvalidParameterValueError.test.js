"use strict";

const test = require("ava");
const InvalidParameterValueError = require("../../../lib/AWSErrors").InvalidParameterValueError;

test("is a subclass of Error", (t) => {
	t.truthy(new InvalidParameterValueError() instanceof Error);
});

test("has a name property", (t) => {
	const error = new InvalidParameterValueError();
	t.is(error.name, "InvalidParameterValue");
});

test("has a code property", (t) => {
	const error = new InvalidParameterValueError();
	t.is(error.code, "InvalidParameterValue");
});

test("has a message property", (t) => {
	const error = new InvalidParameterValueError("foo", "Is not bar");
	t.is(error.message, "Value foo is invalid. Reason: Is not bar.");
});

