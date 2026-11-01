const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')

const gen = { clientId: '1566335017280471060' }
const server = { shortId: 'AVALON', largeImageKey: 'https://example.com/icon.jpg', largeImageText: 'AVALON' }

function fixture() {
    const clients = []
    class Client extends EventEmitter {
        constructor() {
            super()
            this.activities = []
            this.destroyed = false
            clients.push(this)
        }
        login(settings) { this.settings = settings; return Promise.resolve() }
        setActivity(activity, pid) { this.activities.push({ activity, pid }); return Promise.resolve() }
        clearActivity(pid) { this.clearedPid = pid; return Promise.resolve() }
        destroy() { this.destroyed = true; return Promise.resolve() }
    }
    const exports = {}
    const context = {
        exports,
        process,
        require: name => {
            if(name === 'helios-core') return { LoggerUtil: { getLogger: () => ({ info: () => {} }) } }
            if(name === 'discord-rpc-patch') return { Client }
            if(name === './langloader') return { queryJS: key => key }
            throw new Error('Unexpected import: ' + name)
        }
    }
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../app/assets/js/discordwrapper.js'), 'utf8'), context)
    return { rpc: exports, clients }
}

test('Discord is disabled until an application ID is configured', () => {
    const { rpc, clients } = fixture()
    assert.equal(rpc.initRPC({}, server), false)
    assert.equal(clients.length, 0)
})

test('presence uses game PID, image and latest details after connection is ready', async () => {
    const { rpc, clients } = fixture()
    assert.equal(rpc.initRPC(gen, server, 'Starting', 1234), true)
    rpc.updateDetails('In game')
    assert.equal(clients[0].activities.length, 0)
    clients[0].emit('ready')
    const published = clients[0].activities[0]
    assert.equal(published.pid, 1234)
    assert.equal(published.activity.details, 'In game')
    assert.equal(published.activity.largeImageKey, server.largeImageKey)
    assert.equal(clients[0].settings.clientId, gen.clientId)
    await rpc.shutdownRPC()
})

test('game exit clears activity before closing Discord connection', async () => {
    const { rpc, clients } = fixture()
    rpc.initRPC(gen, server, 'Playing', 42)
    const client = clients[0]
    client.emit('ready')
    let completeClear
    client.clearActivity = pid => {
        client.clearedPid = pid
        return new Promise(resolve => { completeClear = resolve })
    }
    const closing = rpc.shutdownRPC()
    assert.equal(client.clearedPid, 42)
    assert.equal(client.destroyed, false)
    completeClear()
    await closing
    assert.equal(client.destroyed, true)
    assert.equal(rpc.shutdownRPC(), undefined)
})

test('late ready from an exited game cannot publish a new activity', async () => {
    const { rpc, clients } = fixture()
    rpc.initRPC(gen, server, 'Old game', 1)
    await rpc.shutdownRPC()
    rpc.initRPC(gen, server, 'New game', 2)
    clients[0].emit('ready')
    clients[1].emit('ready')
    assert.equal(clients[0].activities.length, 0)
    assert.equal(clients[1].activities[0].pid, 2)
    await rpc.shutdownRPC()
})

test('Discord disconnection and rejected activity requests do not escape to the launcher', async () => {
    const { rpc, clients } = fixture()
    rpc.initRPC(gen, server)
    const client = clients[0]
    client.emit('ready')
    client.setActivity = () => Promise.reject(new Error('connection closed'))
    await rpc.updateDetails('Playing')
    client.clearActivity = () => Promise.reject(new Error('connection closed'))
    await rpc.shutdownRPC()
    assert.equal(client.destroyed, true)
})
