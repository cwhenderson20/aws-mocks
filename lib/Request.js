"use strict";

const EventEmitter = require("events").EventEmitter;
const Response = require("./Response");

const _request = new WeakMap();
const _callback = new WeakMap();

class Request extends EventEmitter {
	constructor(request, callback) {
		super();
		_request.set(this, request);
		_callback.set(this, callback);

		if (callback && typeof callback === "function") {
			return request(callback);
		}
	}

	send(cb) {
		_request.get(this)((err, data) => {
			const response = new Response(this, err, data);

			if (cb && typeof cb === "function") {
				cb.call(_request.get(this), err, data);
			}

			if (err) {
				this.emit("error", err, response);
			} else {
				this.emit("success", response);
			}

			this.emit("complete", response);
		});
	}

	promise() {
		return new Promise((resolve, reject) => {
			_request.get(this)((err, data) => {
				if (err) {
					return reject(err);
				}
				return resolve(data);
			});
		});
	}
}

module.exports = Request;
