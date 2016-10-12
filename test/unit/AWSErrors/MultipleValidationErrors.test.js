"use strict";

const test = require("ava");
const MultipleValidationErrors = require("../../../lib/AWSErrors").MultipleValidationErrors;

const errorArray = [new Error("Message 1"), new Error("Message 2")];

test("is a subclass of Error", (t) => {
	t.truthy(new MultipleValidationErrors(errorArray) instanceof Error);
});

test("has a name property", (t) => {
	const error = new MultipleValidationErrors(errorArray);
	t.is(error.name, "MultipleValidationErrors");
});

test("has a code property", (t) => {
	const error = new MultipleValidationErrors(errorArray);
	t.is(error.code, "MultipleValidationErrors");
});

test("has an errors property", (t) => {
	const error = new MultipleValidationErrors(errorArray);
	t.is(error.errors, errorArray);
});

test("accept multiple errors and builds a message", (t) => {
	const error = new MultipleValidationErrors(errorArray);
	const errorMessage = "There were 2 validation errors: \n* Message 1 \n* Message 2 \n";
	t.is(error.message, errorMessage);
});

