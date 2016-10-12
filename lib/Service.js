"use strict";

const Config = require("./Config");

class Service {
	constructor(config) {
		this.config = new Config(config);
	}
}

module.exports = Service;
