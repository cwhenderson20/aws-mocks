"use strict";

const test = require("ava");
const QueueDoesNotExistError = require("../../../lib/AWSErrors").QueueDoesNotExistError;

test("is a subclass of Error", (t) => {
	t.truthy(new QueueDoesNotExistError() instanceof Error);
});

test("has a name property", (t) => {
	const error = new QueueDoesNotExistError();
	t.is(error.name, "QueueDoesNotExist");
});

test("has a code property", (t) => {
	const error = new QueueDoesNotExistError();
	t.is(error.code, "QueueDoesNotExist");
});

test("has a message property", (t) => {
	const error = new QueueDoesNotExistError();
	t.is(error.message, "The queue referred to does not exist");
});
