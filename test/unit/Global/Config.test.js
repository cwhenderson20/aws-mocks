"use strict";

const test = require("ava");
const Config = require("../../../lib/Config");

let config;

test.beforeEach(() => {
	config = null;
});

test("is a function", (t) => {
	t.is(typeof Config, "function");
});

test("returns an empty object with no configuration supplied", (t) => {
	config = new Config();
	t.deepEqual(config, {});
});

test("returns an object with the supplied configuration as keys", (t) => {
	config = new Config({ foo: "bar" });
	t.deepEqual(config, { foo: "bar" });
});
