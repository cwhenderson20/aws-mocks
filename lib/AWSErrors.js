export class AWSError extends Error {
	constructor(message) {
		super(message);
		this.message = message;
		this.time = new Date().toDateString();
	}
}

export class MissingRequiredParameterError extends AWSError {
	constructor(param) {
		const message = `Missing required parameter '${param}' in params`;
		super(message);
		this.name = "MissingRequiredParameter";
		this.code = "MissingRequiredParameter";
		this.message = message;
	}
}

export class MultipleValidationErrors extends AWSError {
	constructor(errors) {
		const message = combineErrorMessages(errors);
		super(message);
		this.name = "MultipleValidationErrors";
		this.code = "MultipleValidationErrors";
		this.message = message;
		this.errors = errors;

		function combineErrorMessages() {
			let msg = `There were ${errors.length} validation errors: \n`;
			errors.forEach((error) => msg += `* ${error.message} \n`);
			return msg;
		}
	}
}

export class QueueDoesNotExistError extends AWSError {
	constructor() {
		const message = "The queue referred to does not exist";
		super(message);
		this.name = "QueueDoesNotExist";
		this.code = "QueueDoesNotExist";
		this.message = message;
	}
}

export class InvalidAttributeNameError extends AWSError {
	constructor() {
		const message = "The attribute referred to does not exist";
		super(message);
		this.name = "InvalidAttributeName";
		this.code = "InvalidAttributeName";
		this.message = message;
	}
}

export class InvalidParameterTypeError extends AWSError {
	constructor(accessor, type) {
		const message = `Expected params.${accessor} to be a ${type}`;
		super(message);
		this.name = "InvalidParameterType";
		this.code = "InvalidParameterType";
		this.message = message;
	}
}
