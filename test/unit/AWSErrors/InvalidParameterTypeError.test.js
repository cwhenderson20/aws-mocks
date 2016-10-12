"use strict";

const test = require("ava");
const InvalidParameterTypeError = require("../../../lib/AWSErrors").InvalidParameterTypeError;

test("is a subclass of Error", (t) => {
	t.truthy(new InvalidParameterTypeError() instanceof Error);
});

test("has a name property", (t) => {
	const error = new InvalidParameterTypeError();
	t.is(error.name, "InvalidParameterType");
});

test("has a code property", (t) => {
	const error = new InvalidParameterTypeError();
	t.is(error.code, "InvalidParameterType");
});

test("has a message property", (t) => {
	const error = new InvalidParameterTypeError("Attributes['fake']", "string");
	t.is(error.message, "Expected params.Attributes['fake'] to be a string");
});

