"use strict";

class AWSError extends Error {
	constructor(message) {
		super(message);
		this.message = message;
		this.time = new Date().toDateString();
	}
}

class MissingRequiredParameterError extends AWSError {
	constructor(param) {
		const message = `Missing required parameter '${param}' in params`;
		super(message);
		this.name = "MissingRequiredParameter";
		this.code = "MissingRequiredParameter";
		this.message = message;
	}
}

class MultipleValidationErrors extends AWSError {
	constructor(errors) {
		const message = combineErrorMessages(errors);
		super(message);
		this.name = "MultipleValidationErrors";
		this.code = "MultipleValidationErrors";
		this.message = message;
		this.errors = errors;

		function combineErrorMessages() {
			let msg = `There were ${errors.length} validation errors: \n`;
			errors.forEach((error) => {
				msg += `* ${error.message} \n`;
			});
			return msg;
		}
	}
}

class QueueDoesNotExistError extends AWSError {
	constructor() {
		const message = "The queue referred to does not exist";
		super(message);
		this.name = "QueueDoesNotExist";
		this.code = "QueueDoesNotExist";
		this.message = message;
	}
}

class InvalidAttributeNameError extends AWSError {
	constructor() {
		const message = "The attribute referred to does not exist";
		super(message);
		this.name = "InvalidAttributeName";
		this.code = "InvalidAttributeName";
		this.message = message;
	}
}

class InvalidParameterTypeError extends AWSError {
	constructor(accessor, type) {
		const message = `Expected params.${accessor} to be a ${type}`;
		super(message);
		this.name = "InvalidParameterType";
		this.code = "InvalidParameterType";
		this.message = message;
	}
}

class InvalidParameterValueError extends AWSError {
	constructor(value, msg) {
		const message = `Value ${value} is invalid. Reason: ${msg}.`;
		super(message);
		this.name = "InvalidParameterValue";
		this.code = "InvalidParameterValue";
		this.message = message;
	}
}

module.exports = {
	AWSError,
	MissingRequiredParameterError,
	MultipleValidationErrors,
	QueueDoesNotExistError,
	InvalidAttributeNameError,
	InvalidParameterTypeError,
	InvalidParameterValueError,
};
