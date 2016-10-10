"use strict";

class Response {
	constructor(request, error, data) {
		error = error || null;
		data = data || null;

		Object.defineProperties(this, {
			request: {
				value: request,
				enumerable: true,
				writable: false,
			},
			error: {
				value: error,
				enumerable: true,
				writable: false,
			},
			data: {
				value: data,
				enumerable: true,
				writable: false,
			},
		});

		return this;
	}
}

module.exports = Response;
