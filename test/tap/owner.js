var mr = require("npm-registry-mock")
var test = require("tap").test

var common = require("../common-tap.js")

var server

var EXEC_OPTS = {}

var jashkenas = {
  name  : "jashkenas",
  email : "jashkenas@gmail.com"
}

var othiym23 = {
  name  : "othiym23",
  email : "forrest@npmjs.com"
}

function shrt (user) {
  return user.name+" <"+user.email+">\n"
}

function mocks (server) {
  // test 1
  server.get("/-/user/org.couchdb.user:othiym23")
    .reply(200, othiym23)
  server.get("/underscore")
    .reply(200, {_id:1,_rev:1,maintainers:[jashkenas]})
  server.put(
    "/underscore/-rev/1",
    {_id: 1,_rev:1,maintainers:[jashkenas,othiym23]},
    {}
  ).reply(200, {_id:1,_rev:2,maintainers:[jashkenas,othiym23]})

  // test 2
  server.get("/underscore")
    .reply(200, {_id:1,_rev:2,maintainers:[jashkenas,othiym23]})

  // test 3
  server.put(
    "/underscore/-rev/2",
    {_id:1,_rev:2,maintainers:[jashkenas]},
    {}
  ).reply(200, {_id:1,_rev:3,maintainers:[jashkenas]})
}

test("setup", function (t) {
  common.npm(
    [
      "--loglevel", "silent",
      "cache", "clean"
    ],
    EXEC_OPTS,
    function (err, code) {
      t.ifError(err,  "npm cache clean ran without error")
      t.notOk(code,   "npm cache clean exited cleanly")

      mr({ port : common.port, mocks : mocks }, function (s) {
        server = s
        t.end()
      })
    }
  )
})

test("npm owner add", function (t) {
  common.npm(
    [
      "--loglevel", "silent",
      "--registry", common.registry,
      "owner", "add", "othiym23", "underscore"
    ],
    EXEC_OPTS,
    function (err, code, stdout, stderr) {
      t.ifError(err,  "npm owner add ran without error")
      t.notOk(code,   "npm owner add exited cleanly")
      t.notOk(stderr, "npm owner add ran silently")
      t.equal(stdout, "+ othiym23 (underscore)\n", "got expected add output")

      t.end()
    }
  )
})

test("npm owner ls", function (t) {
  common.npm(
    [
      "--loglevel", "silent",
      "--registry", common.registry,
      "owner", "ls", "underscore"
    ],
    EXEC_OPTS,
    function (err, code, stdout, stderr) {
      t.ifError(err,  "npm owner ls ran without error")
      t.notOk(code,   "npm owner ls exited cleanly")
      t.notOk(stderr, "npm owner ls ran silently")
      t.equal(stdout, shrt(jashkenas)+shrt(othiym23), "got expected ls output")

      t.end()
    }
  )
})

test("npm owner rm", function (t) {
  common.npm(
    [
      "--loglevel", "silent",
      "--registry", common.registry,
      "owner", "rm", "othiym23", "underscore"
    ],
    EXEC_OPTS,
    function (err, code, stdout, stderr) {
      t.ifError(err,  "npm owner rm ran without error")
      t.notOk(code,   "npm owner rm exited cleanly")
      t.notOk(stderr, "npm owner rm ran silently")
      t.equal(stdout, "- othiym23 (underscore)\n", "got expected add output")

      t.end()
    }
  )
})

test("cleanup", function (t) {
  server.close()
  t.end()
})
