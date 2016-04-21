"use strict";

const paramTypes = {
	QueueUrl: "string",
	Entries: [{
		Id: "string",
		ReceiptHandle: "string"
	}],
	AttributeNames: ["string"],
	MaxNumberOfMessages: "number",
	MessageAttributes: {
		someKey: {
			DataType: "string",
			BinaryListValues: ["multiple", "Buffer", "string"]
		}
	}
}

function iterate(attributes, location) {
	if (location === undefined) {
		location = "";
	}

	for (let attr in attributes) {
		if (!attributes.hasOwnProperty(attr)) {
			continue;
		}

		if (!!attributes[attr] && attributes[attr] === Object(attributes[attr]) && !Array.isArray(attributes[attr])) {

			location ? console.log(`${location}[${attr}] is an object`) : console.log(`${attr} is an object`);

			location ? iterate(attributes[attr], `${location}[${attr}]`) : iterate(attributes[attr], attr);

		} else if (!!attributes[attr] && Array.isArray(attributes[attr])) {

			location ? console.log(`${location}[${attr}] is array`) : console.log(`${attr} is an array`);

			if (typeof attributes[attr][0] === "string") {

				console.log("First array attribute is a string");

				for (let i = 1; i < attributes[attr].length; i++) {
					location
					? console.log(`${location}[${attr}][${i}] is type ${typeof attributes[attr][i]}`)
					: console.log(`${attr}[${i}] is type ${typeof attributes[attr][i]}`);
				}

			} else {

				console.log("iterating over array");
				attributes[attr].forEach((a) => iterate(a, `${location + attr}`));

			}
		} else {
			console.log(`attribute ${attr} is ${typeof attr}`);
		}
	}
}

iterate(paramTypes);
