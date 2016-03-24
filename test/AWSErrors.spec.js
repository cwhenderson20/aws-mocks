import { assert } from "chai";
import * as AWSErrors from "../lib/AWSErrors";

describe("AWSErrors", function () {
	describe("AWSError class", function () {
		it("is a subclass of Error", function () {
			assert.ok(new AWSErrors.AWSError() instanceof Error);
		});

		it("accepts a message parameter", function () {
			const error = new AWSErrors.AWSError("message");
			assert.strictEqual(error.message, "message");
		});

		it("automatically generates a timestamp", function () {
			const error = new AWSErrors.AWSError("message");
			assert.ok(error.time);
			assert.ok(new Date(error.time));
		});
	});

	describe("MissingRequiredParameterError", function () {
		it("is a subclass of Error", function () {
			assert.ok(new AWSErrors.MissingRequiredParameterError("param") instanceof Error);
		});

		it("has a name property", function () {
			const error = new AWSErrors.MissingRequiredParameterError("param");
			assert.strictEqual(error.name, "MissingRequiredParameter");
		});

		it("has a code property", function () {
			const error = new AWSErrors.MissingRequiredParameterError("param");
			assert.strictEqual(error.code, "MissingRequiredParameter");
		});

		it("accepts a param and generates a message", function () {
			const error = new AWSErrors.MissingRequiredParameterError("param");
			assert.strictEqual(error.message, "Missing required parameter 'param' in params");
		});
	});

	describe("MultipleValidationErrors", function () {
		const errorArray = [new Error("Message 1"), new Error("Message 2")];

		it("is a subclass of Error", function () {
			assert.ok(new AWSErrors.MultipleValidationErrors(errorArray) instanceof Error);
		});

		it("has a name property", function () {
			const error = new AWSErrors.MultipleValidationErrors(errorArray);
			assert.strictEqual(error.name, "MultipleValidationErrors");
		});

		it("has a code property", function () {
			const error = new AWSErrors.MultipleValidationErrors(errorArray);
			assert.strictEqual(error.code, "MultipleValidationErrors");
		});

		it("has an errors property", function () {
			const error = new AWSErrors.MultipleValidationErrors(errorArray);
			assert.strictEqual(error.errors, errorArray);
		});

		it("accept multiple errors and builds a message", function () {
			const error = new AWSErrors.MultipleValidationErrors(errorArray);
			const errorMessage = "There were 2 validation errors: \n* Message 1 \n* Message 2 \n";
			assert.strictEqual(error.message, errorMessage);
		});
	});
});
