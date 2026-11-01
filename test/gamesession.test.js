const assert = require('node:assert/strict')
const { EventEmitter, once } = require('node:events')
const { spawn } = require('node:child_process')
const { test } = require('node:test')
const GameSession = require('../app/assets/js/gamesession')

function fixture() {
    const calls = []
    const session = new GameSession({
        onChange: busy => calls.push(busy ? 'locked' : 'unlocked'),
        onStarted: () => calls.push('hidden'),
        onStopped: () => calls.push('restored'),
        onError: error => calls.push(error.message)
    })
    return { session, calls }
}

test('rapid clicks admit one launch and preparation failure permits retry', () => {
    const { session, calls } = fixture()
    assert.equal(session.tryStart(), true)
    for(let i = 0; i < 100; i++) assert.equal(session.tryStart(), false)
    assert.deepEqual(calls, ['locked'])
    session.release()
    assert.equal(session.tryStart(), true)
})

test('game stays locked after preparation and restores once on exit without Discord', () => {
    const { session, calls } = fixture()
    const child = new EventEmitter()
    session.tryStart()
    session.track(child)
    child.emit('spawn')
    session.release()
    assert.equal(session.busy, true)
    assert.equal(session.tryStart(), false)
    assert.throws(() => session.track(new EventEmitter()))
    child.emit('close', 0)
    child.emit('close', 0)
    assert.equal(session.child, null)
    assert.deepEqual(calls, ['locked', 'hidden', 'unlocked', 'restored'])
    assert.equal(session.tryStart(), true)
})

test('spawn failure restores the launcher and ignores later close or spawn', () => {
    const { session, calls } = fixture()
    const child = new EventEmitter()
    session.tryStart()
    session.track(child)
    child.emit('error', new Error('ENOENT'))
    child.emit('close', -2)
    child.emit('spawn')
    assert.equal(session.busy, false)
    assert.deepEqual(calls, ['locked', 'unlocked', 'restored', 'ENOENT'])
})

test('actual child process hides on spawn and restores on termination', async () => {
    const { session, calls } = fixture()
    session.tryStart()
    const child = spawn(process.execPath, ['-e', 'setTimeout(() => process.exit(0), 75)'])
    session.track(child)
    await once(child, 'close')
    assert.deepEqual(calls, ['locked', 'hidden', 'unlocked', 'restored'])
    assert.equal(session.busy, false)
})
