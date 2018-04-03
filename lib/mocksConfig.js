"use strict";

function generateConfig() {
	const env = process.env.NODE_ENV || "development";
	const host = process.env.MONGODB_HOST || "localhost";
	const port = process.env.MONGODB_PORT || 27017;
	let db = process.env.MONGODB_DB || "mockSQS";

	if (env === "test") {
		db = `${db}_${env}`;
	}

	return {
		db: process.env.MOCK_SQS_DB || `mongodb://${host}:${port}/${db}`,
	};
}

module.exports = generateConfig();
