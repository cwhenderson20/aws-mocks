"use strict";

class Config {
	constructor(config) {
		const suppliedConfig = config || {};
		return Object.assign({}, suppliedConfig);
	}
}

module.exports = Config;
