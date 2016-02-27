var test = require('tape')
var ssbGit = require('..')
var pullGitRepoTests = require('abstract-pull-git-repo/tests')
var ssbKeys = require('ssb-keys')
var pull = require('pull-stream')

var createSbot = require('scuttlebot')
  .use(require('scuttlebot/plugins/master'))
  .use(require('scuttlebot/plugins/blobs'))

var sbot = createSbot({
  temp: 'test-git-ssb', timeout: 200,
  allowPrivate: true,
  keys: ssbKeys.generate()
})

test.onFinish(function () {
  sbot.close(true)
})

test('links to objects are detected', function (t) {
  ssbGit.createRepo(sbot, function (err, repo) {
    t.error(err, 'created repo')
    var update = pullGitRepoTests.getUpdate(0)
    repo.update(update.refs, update.objects, function (err) {
      t.error(err, 'pushed update')
      pull(
        sbot.links({
          dest: '&',
          values: true
        }),
        pull.collect(function (err, msgs) {
          t.error(err, 'got links')
          t.equals(msgs.length, update.hashes.length, 'links to objects')
          t.end()
        })
      )
    })
  })
})

test('repo implements abstract pull git repo interface', function (t) {
  ssbGit.createRepo(sbot, function (err, repoA) {
    t.error(err, 'created repo')
    pullGitRepoTests.repos(t.test, repoA, function (cb) {
      ssbGit.getRepo(sbot, repoA.id, {live: true}, cb)
    })
  })
})

test('get repos', function (t) {
  ssbGit.createRepo(sbot, function (err, repo) {
    t.error(err, 'created repo')
    pull(
      ssbGit.repos(sbot),
      pull.collect(function (err, repos) {
        t.error(err, 'got repos')
        t.ok(repos.some(function (r) { return r.id == repo.id }),
          'new repo is listed', repos.length)
        t.end()
      })
    )
  })
})
