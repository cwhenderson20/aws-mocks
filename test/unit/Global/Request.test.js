"use strict";

const test = require("ava");
const sinon = require("sinon");
const Request = require("../../../lib/Request");
const Response = require("../../../lib/Response");
const EventEmitter = require("events").EventEmitter;

let request;

test.beforeEach(() => {
	request = null;
});

test("is a function", (t) => {
	t.true(typeof Request === "function");
});

test("inherits from EventEmitter", (t) => {
	request = new Request();
	t.true(request instanceof EventEmitter);
});

test("constructor takes a request function parameter", (t) => {
	const requestFunctionSpy = sinon.spy();
	const callbackFunctionSpy = sinon.spy();
	request = new Request(requestFunctionSpy, callbackFunctionSpy);

	t.true(requestFunctionSpy.calledOnce);
	t.false(callbackFunctionSpy.called);
});

test("constructor does not call the request function if the supplied callback is not a function", (t) => {
	const requestFunctionSpy = sinon.spy();
	request = new Request(requestFunctionSpy, "string");

	t.false(requestFunctionSpy.called);
});

test("instance has a send method", (t) => {
	request = new Request();

	t.truthy(request.send);
	t.true(typeof request.send === "function");
});

test("instance has a promise method", (t) => {
	request = new Request();

	t.truthy(request.promise);
	t.true(typeof request.promise === "function");
});

test.cb("send method › invokes a callback function with an error if the request calls back with an error", (t) => {
	const requestFunctionStub = sinon.stub();
	requestFunctionStub.yields(new Error("Error message"));
	request = new Request(requestFunctionStub);

	request.on("error", () => {});
	request.send((err, data) => {
		t.truthy(err);
		t.is(err.message, "Error message");
		t.falsy(data);
		t.end();
	});
});

test.cb("send method › invokes a callback function with data if the request calls back with data", (t) => {
	const requestFunctionStub = sinon.stub();
	requestFunctionStub.yields(null, "data");
	request = new Request(requestFunctionStub);

	request.send((err, data) => {
		t.falsy(err);
		t.truthy(data);
		t.is(data, "data");
		t.end();
	});
});

test.cb("send method › emits an error event if the request calls back with an error", (t) => {
	const requestFunctionStub = sinon.stub();
	requestFunctionStub.yields(new Error("Error message"));
	request = new Request(requestFunctionStub);

	request.on("success", () => t.fail());
	request.on("error", (err, response) => {
		t.truthy(err);
		t.true(response instanceof Response);
		t.is(err.message, "Error message");
		t.end();
	});
	request.send();
});

test.cb("send method › emits a success event if the request calls back without error", (t) => {
	const requestFunctionStub = sinon.stub();
	requestFunctionStub.yields(null, "data");
	request = new Request(requestFunctionStub);

	request.on("error", () => {
		t.fail();
		t.end();
	});
	request.on("success", (response) => {
		t.true(response instanceof Response);
		t.true(requestFunctionStub.calledOnce);
		t.end();
	});
	request.send();
});

test.cb("send method › emits a complete event if the request calls back with an error", (t) => {
	const requestFunctionStub = sinon.stub();
	requestFunctionStub.yields(new Error("Error message"));
	request = new Request(requestFunctionStub);

	request.on("success", () => {
		t.fail();
		t.end();
	});
	request.on("error", () => {});
	request.on("complete", (response) => {
		t.true(response instanceof Response);
		t.true(requestFunctionStub.calledOnce);
		t.end();
	});
	request.send();
});

test.cb("send method › emits a complete event if the request calls back without an error", (t) => {
	const requestFunctionStub = sinon.stub();
	requestFunctionStub.yields();
	request = new Request(requestFunctionStub);

	request.on("success", () => {});
	request.on("error", () => {
		t.fail();
		t.end();
	});
	request.on("complete", (response) => {
		t.true(requestFunctionStub.calledOnce);
		t.true(response instanceof Response);
		t.end();
	});
	request.send();
});

test.cb("promise method › returns a promise", (t) => {
	const requestFunctionStub = sinon.stub();
	requestFunctionStub.yields();
	request = new Request(requestFunctionStub);

	t.true(typeof request.promise().then === "function");
	t.end();
});

test.cb("promise method › rejects the promise if the request calls back with an error", (t) => {
	const requestFunctionStub = sinon.stub();
	requestFunctionStub.yields(new Error("Error message"));
	request = new Request(requestFunctionStub);

	request.promise().then(() => {
		t.fail();
		t.end();
	}).catch((err) => {
		t.truthy(err);
		t.is(err.message, "Error message");
		t.end();
	});
});

test.cb("promise method › resolves the promise if the request calls back without an error", (t) => {
	const requestFunctionStub = sinon.stub();
	requestFunctionStub.yields();
	request = new Request(requestFunctionStub);

	request.promise().then(() => {
		t.pass();
		t.end();
	}).catch(() => {
		t.fail();
		t.end();
	});
});
