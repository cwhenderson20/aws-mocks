// import { MissingRequiredParameterError, MultipleValidationErrors } from "./AWSErrors";

export default class SQS {
	constructor(options = {}) {
		this.options = Object.assign({ region: "us-east-1", params: {} }, options);
	}

	addPermission(params = {}) {
		params = Object.assign({}, this.options.params, params);
	}

	changeMessageVisibility(params = {}) {
		params = Object.assign({}, this.options.params, params);
	}

	changeMessageVisibilityBatch(params = {}) {
		params = Object.assign({}, this.options.params, params);
	}

	createQueue(params = {}) {
		params = Object.assign({}, this.options.params, params);
	}

	deleteMessage(params = {}) {
		params = Object.assign({}, this.options.params, params);
	}

	deleteMessageBatch(params = {}) {
		params = Object.assign({}, this.options.params, params);
	}

	deleteQueue(params = {}) {
		params = Object.assign({}, this.options.params, params);
	}

	getQueueAttributes(params = {}) {
		params = Object.assign({}, this.options.params, params);
	}

	getQueueUrl(params = {}) {
		params = Object.assign({}, this.options.params, params);
	}

	listDeadLetterSourceQueues(params = {}) {
		params = Object.assign({}, this.options.params, params);
	}

	listQueue(params = {}) {
		params = Object.assign({}, this.options.params, params);
	}

	purgeQueue(params = {}) {
		params = Object.assign({}, this.options.params, params);
	}

	receiveMessage(params = {}) {
		params = Object.assign({}, this.options.params, params);
	}

	removePermission(params = {}) {
		params = Object.assign({}, this.options.params, params);
	}

	sendMessage(params = {}) {
		params = Object.assign({}, this.options.params, params);
	}

	sendMessageBatch(params = {}) {
		params = Object.assign({}, this.options.params, params);
	}

	setQueueAttributes(params = {}) {
		params = Object.assign({}, this.options.params, params);
	}
}

// function checkParams(params, reqParams) {
// 	const missingParams = [];

// 	reqParams.forEach((reqParam) => params[reqParam] ? null : missingParams.push(reqParam));

// 	if (missingParams.length) {
// 		const errors = missingParams.map((param) => {
// 			return new MissingRequiredParameterError(param);
// 		});

// 		if (missingParams.length === 1) {
// 			return errors[0];
// 		} else {
// 			return new MultipleValidationErrors(errors);
// 		}
// 	}
// }
