"use strict";

function buildConnectionStr(host, port, db) {
	return "mongodb://" + host + ":" + port + "/" + db;
}

function generateConfig() {
	const env = process.env.NODE_ENV || "development";
	const host = process.env.MONGODB_HOST || 'localhost';
	const port = process.env.MONGODB_PORT || 27017;
	let db = process.env.MONGODB_DB || 'mockSQS';

	if (env === "test") {
		db += "_" + env;
	}

	return {
		db: process.env.MOCK_SQS_DB || buildConnectionStr(host, port, db),
	};
}

module.exports = generateConfig();
