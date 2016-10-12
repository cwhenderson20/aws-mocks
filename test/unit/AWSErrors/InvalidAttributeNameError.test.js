"use strict";

const test = require("ava");
const InvalidAttributeNameError = require("../../../lib/AWSErrors").InvalidAttributeNameError;

test("is a subclass of Error", (t) => {
	t.truthy(new InvalidAttributeNameError() instanceof Error);
});

test("has a name property", (t) => {
	const error = new InvalidAttributeNameError();
	t.is(error.name, "InvalidAttributeName");
});

test("has a code property", (t) => {
	const error = new InvalidAttributeNameError();
	t.is(error.code, "InvalidAttributeName");
});

test("has a message property", (t) => {
	const error = new InvalidAttributeNameError();
	t.is(error.message, "The attribute referred to does not exist");
});
