"use strict";

const test = require("ava");
const Response = require("../../../lib/Response");

let response;

test.beforeEach(() => {
	response = null;
});

test("is a function", (t) => {
	t.is(typeof Response, "function");
});

test("returns an object", (t) => {
	response = new Response();
	t.true(response instanceof Object);
});

test("returns a default object with properties", (t) => {
	response = new Response();
	t.true({}.hasOwnProperty.call(response, "request"));
	t.true({}.hasOwnProperty.call(response, "error"));
	t.true({}.hasOwnProperty.call(response, "data"));
});

test("returns a default object with the correct property descriptors", (t) => {
	response = new Response();
	const requestDescriptor = Object.getOwnPropertyDescriptor(response, "request");
	const errorDescriptor = Object.getOwnPropertyDescriptor(response, "error");
	const dataDescriptor = Object.getOwnPropertyDescriptor(response, "data");

	t.is(requestDescriptor.value, undefined);
	t.is(requestDescriptor.enumerable, true);
	t.is(requestDescriptor.writable, false);

	t.is(errorDescriptor.value, null);
	t.is(errorDescriptor.enumerable, true);
	t.is(errorDescriptor.writable, false);

	t.is(dataDescriptor.value, null);
	t.is(dataDescriptor.enumerable, true);
	t.is(dataDescriptor.writable, false);
});

test("takes request, error, and data properties and returns an object", (t) => {
	response = new Response("request", "error", "data");

	t.is(response.request, "request");
	t.is(response.error, "error");
	t.is(response.data, "data");
});
