"use strict";

const test = require("ava");
const MissingRequiredParameterError = require("../../../lib/AWSErrors").MissingRequiredParameterError;

test("is a subclass of Error", (t) => {
	t.truthy(new MissingRequiredParameterError("param") instanceof Error);
});

test("has a name property", (t) => {
	const error = new MissingRequiredParameterError("param");
	t.is(error.name, "MissingRequiredParameter");
});

test("has a code property", (t) => {
	const error = new MissingRequiredParameterError("param");
	t.is(error.code, "MissingRequiredParameter");
});

test("accepts a param and generates a message", (t) => {
	const error = new MissingRequiredParameterError("param");
	t.is(error.message, "Missing required parameter 'param' in params");
});
