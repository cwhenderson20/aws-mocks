# aws-mocks

[![Build Status](https://travis-ci.org/cwhenderson20/aws-mocks.svg?branch=master)](https://travis-ci.org/cwhenderson20/aws-mocks) [![Coverage Status](https://coveralls.io/repos/github/cwhenderson20/aws-mocks/badge.svg?branch=master)](https://coveralls.io/github/cwhenderson20/aws-mocks?branch=master)

This module is intended to be a drop-in replacement for the node.js aws-sdk for use in local environments when it's not ideal to hit true AWS endpoints. This is not a mocking service for unit testing as it brings in outside dependencies such as mongodb and the file system (for a unit testing, look to [this module](https://github.com/antonosmond/mock-aws)); it could, however, be used for integration and functional testing.

**Please note:** As explained below, this module currently only mocks SQS, and not even completely. If you are looking to mock a different AWS service, I'd love your help getting started!

## Installation

```bash
npm install -D aws-mocks
```

## Usage

It's up to you how you determine when the mock services should be used over the real ones, though you'll likely make a determination based on `NODE_ENV`. For example:

```js
const env = process.env.NODE_ENV;
let AWS;

// if the environment is a local one, require mocks
if (!env || env === "development") {
  AWS = require("aws-mocks");
// otherwise, require the real SDK
} else {
  AWS = require("aws-sdk");
}
```

You can also (and probably should) mock services at the service level rather than the SDK level:

```js
const AWS = require("aws-sdk");
const MockAWS = require("aws-mocks");

const env = process.env.NODE_ENV;
let sqs;

if (!env || env === "development") {
  sqs = new AWS.SQS();
} else {
  sqs = new MockAWS.SQS();
}
```

## Requirements
In order to emulate AWS service functionality, it is necessary to rely on external resources. Listed below are the dependencies for each service. If you do not plan on using various services, don't worry about installing the services' dependencies.

- **SQS**
	- **mongodb**
 		- Default connection string: `mongodb://localhost:27017`, configurable with environment variable `MOCK_SQS_DB`
 		- Default collection name `mockSQS` (not configurable yet)

## Limitations
It should go without saying that mocking AWS services is a very difficult job to get right. AWS services have many intracacies and idosynracies that would be difficult to tease out without very extensive testing.

Additionally, it would be impossible to make the mocks work exactly like their AWS counterparts even with a perfect knowledge of their functioning due to the distributed nature of the AWS infrastructure. Therefore, these mocks are meant to be basic replacements, not perfect drop-ins. 

Currently, the only service implemented is SQS (that's what I needed first), and not all methods are fleshed out (though the basic ones are).

## Services and Methods Implemented
- SQS ([docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html))
	- `changeMessageVisibility`
	- `deleteMessage`
	- `getQueueUrl`
	- `listQueues`
	- `receiveMessage`
	- `sendMessage`
	- `setQueueAttributes`

## Notes
If you have any interest in helping develop service mocks, please submit a PR! There's no way I can do all of this myself. 😉

Also, since this is so new (0.0.8 release!), expect the API to contain breaking changes on minor versions.

## Contributing
I'd love your help developing new feaures, so don't be shy to submit PRs! I don't have a huge amount of time to develop mocks for each service, so I'll do the ones I need first, which will likely be SQS, S3, Glacier, SNS, and maybe Lambda. 

This module uses the awesome (but still new) [AVA](https://github.com/sindresorhus/ava) for testing and [ESLint](https://github.com/eslint/eslint) for linting. I'll be setting up TravisCI soon.
