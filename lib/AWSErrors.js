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
	}
}

function combineErrorMessages(errors) {
	let message = `There were ${errors.length} validation errors: \n`;
	errors.forEach((error) => message += `* ${error.message} \n`);
	return message;
}
