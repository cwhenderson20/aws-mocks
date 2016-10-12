"use strict";

const test = require("ava");
const Service = require("../../../lib/Service");

let service;

test.beforeEach(() => {
	service = null;
});

test("is a function", (t) => {
	t.is(typeof Service, "function");
});

test("assigns a config property", (t) => {
	service = new Service();
	t.true({}.hasOwnProperty.call(service, "config"));
});

