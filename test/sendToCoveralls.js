"use strict";

const should = require("should");
const sinon = require("sinon");
const logDriver = require("log-driver");
const FormData = require("form-data");
const index = require("..");

logDriver({ level: false });

function getTestResponse(value) {
  return {
    on: (key, fn) => {
      if (key === "data") {
        return fn(value);
      }
      fn();
    },
  };
}

describe("sendToCoveralls", () => {
  let realCoverallsHost;
  beforeEach(() => {
    realCoverallsHost = process.env.COVERALLS_ENDPOINT;
  });

  afterEach(() => {
    sinon.restore();
    if (realCoverallsHost !== undefined) {
      process.env.COVERALLS_ENDPOINT = realCoverallsHost;
    } else {
      delete process.env.COVERALLS_ENDPOINT;
    }
  });

  it("passes on the correct params to form-data", done => {
    const object = { some: "obj" };
    const spyAppend = sinon.stub(FormData.prototype, "append");
    const spySubmit = sinon
      .stub(FormData.prototype, "submit")
      .yields(null, getTestResponse("response"));
    index.sendToCoveralls(object, (err, response) => {
      try {
        spyAppend
          .calledOnceWith("json", JSON.stringify(object))
          .should.be.true(
            "form data append not called with the correct values"
          );
        spySubmit
          .calledOnceWith("https://coveralls.io/api/v1/jobs", sinon.match.func)
          .should.be.true(
            "form data submit not called with the correct values"
          );
        should(err).be.null();
        response.body.should.equal("response");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("when request rejects pass the error to the callback", done => {
    const error = new Error("test error");
    sinon.stub(FormData.prototype, "submit").yields(error);
    const object = { some: "obj" };

    index.sendToCoveralls(object, (err, response) => {
      try {
        err.should.equal(error);
        should(response).be.undefined();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("allows sending to enterprise url", done => {
    process.env.COVERALLS_ENDPOINT = "https://coveralls-ubuntu.domain.com";
    const spySubmit = sinon
      .stub(FormData.prototype, "submit")
      .yields(null, getTestResponse("response"));
    const object = { some: "obj" };

    index.sendToCoveralls(object, (err, response) => {
      try {
        spySubmit
          .calledOnceWith(
            "https://coveralls-ubuntu.domain.com/api/v1/jobs",
            sinon.match.func
          )
          .should.be.true(
            "form data submit not called with the correct values"
          );
        should(err).be.null();
        response.body.should.equal("response");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it("writes output to stdout when --stdout is passed", done => {
    const object = { some: "obj" };

    // set up mock process.stdout.write temporarily
    const origStdoutWrite = process.stdout.write;
    process.stdout.write = function (...args) {
      if (args[0] === JSON.stringify(object)) {
        process.stdout.write = origStdoutWrite;
        return done();
      }

      origStdoutWrite.apply(this, args);
    };

    index.options.stdout = true;

    index.sendToCoveralls(object, (err, response) => {
      should.not.exist(err);
      response.statusCode.should.equal(200);
    });
  });
});
