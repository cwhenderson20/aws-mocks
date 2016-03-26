function generateConfig() {
	const env = process.env.NODE_ENV || "development";

	if (env === "test") {
		return {
			db: process.env.MOCK_SQS_DB || "mongodb://localhost:27017/mockSQS_test"
		};
	} else {
		return {
			db: process.env.MOCK_SQS_DB || "mongodb://localhost:27017/mockSQS"
		};
	}
}

export default generateConfig();
