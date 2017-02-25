"use strict";

const Config = require("./lib/Config");
const Request = require("./lib/Request");
const Response = require("./lib/Response");
const Service = require("./lib/Service");
const SQS = require("./lib/SQS");

module.exports = {
	Config,
	Request,
	Response,
	Service,
	SQS,
};
