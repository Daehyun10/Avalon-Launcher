const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const { test } = require('node:test')
const Address = require('../app/assets/js/serveraddress')

const localRequire = createRequire(path.join(__dirname, '../app/assets/js/processbuilder.js'))
const logger = { info() {}, warn() {}, error() {} }
const original = { rawServer: { id: 'A', autoconnect: true, minecraftVersion: '1.18.2' }, hostname: 'default.example.com', port: 25565 }

function configFixture(saved = null) {
    let stored = saved
    const api = {}
    const context = {
        exports: api, process,
        require: name => {
            if(name === './serveraddress') return Address
            if(name === '@electron/remote') return { app: { getPath: () => '/virtual-launcher' } }
            if(name === 'helios-core') return { LoggerUtil: { getLogger: () => logger } }
            if(name === 'fs-extra') return {
                existsSync: () => stored != null,
                readFileSync: () => stored,
                writeFileSync: (_file, value) => { stored = value },
                ensureDirSync() {}
            }
            return localRequire(name)
        }
    }
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../app/assets/js/configmanager.js'), 'utf8'), context)
    api.load()
    return { api, saved: () => stored }
}

function builder(config, server = original) {
    const context = {
        module: { exports: {} }, process,
        require: name => name === './configmanager' ? config : localRequire(name)
    }
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../app/assets/js/processbuilder.js'), 'utf8'), context)
    return new context.module.exports(server, {}, {}, {}, 'test')
}

test('accepts domains, IPv4, IDN and IPv6 with optional port', () => {
    assert.equal(Address.parseAddress(' PLAY.Example.com ').address, 'play.example.com:25565')
    assert.equal(Address.parseAddress('192.168.1.10:25566').port, 25566)
    assert.equal(Address.parseAddress('localhost:1').hostname, 'localhost')
    assert.equal(Address.parseAddress('[2001:db8::1]:65535').address, '[2001:db8::1]:65535')
    assert.equal(Address.parseAddress('::1').address, '[::1]:25565')
    assert(Address.parseAddress('예시.한국').hostname.startsWith('xn--'))
    assert.equal(Address.parseAddress('   '), null)
})

test('rejects URLs, paths, whitespace, malformed hosts and out-of-range ports', () => {
    for(const input of ['https://example.com', 'example.com/path', 'a b', 'a@b', 'a:0', 'a:65536', 'a:-1', 'a:abc', 'a:', '[::1', '[127.0.0.1]:25565', 'example..com', '-bad.com', '256.0.0.1', 'host:2:3', 'a?b', null]) {
        assert.equal(Address.isValid(input), false, String(input))
    }
})

test('overrides are profile-specific and survive config reload', () => {
    const first = configFixture()
    first.api.setServerAddress('A', 'one.example.com:25566')
    first.api.setServerAddress('B', 'two.example.com')
    first.api.save()
    const reloaded = configFixture(first.saved()).api
    assert.equal(reloaded.getServerAddress('A'), 'one.example.com:25566')
    assert.equal(reloaded.getServerAddress('B'), 'two.example.com:25565')
    assert.equal(reloaded.getServerAddress('C'), '')
    assert.throws(() => reloaded.setServerAddress('A', 'invalid:70000'))
    assert.equal(reloaded.getServerAddress('A'), 'one.example.com:25566')
    reloaded.setServerAddress('A', '')
    assert.equal(reloaded.getServerAddress('A'), '')
    assert.equal(reloaded.getServerAddress('B'), 'two.example.com:25565')
})

test('older config files migrate without losing user settings', () => {
    const initial = configFixture()
    const old = JSON.parse(initial.saved())
    delete old.serverAddresses
    old.settings.game.resWidth = 1600
    const migrated = configFixture(JSON.stringify(old)).api
    assert.equal(migrated.getGameWidth(), 1600)
    assert.equal(migrated.getServerAddress('A'), '')
    migrated.setServerAddress('A', 'play.example.com')
    assert.equal(migrated.getServerAddress('A'), 'play.example.com:25565')
})

test('default restoration uses current catalog and leaves shared profile unchanged', () => {
    const before = JSON.stringify(original)
    assert.equal(Address.resolve(original).hostname, 'default.example.com')
    assert.equal(Address.resolve(original, 'custom.example.com:25566').port, 25566)
    original.hostname = 'updated.example.com'
    assert.equal(Address.resolve(original).hostname, 'updated.example.com')
    original.hostname = 'default.example.com'
    assert.equal(JSON.stringify(original), before)
})

test('Minecraft 1.18 launch and status lookup resolve the same custom endpoint', () => {
    const { api } = configFixture()
    api.setServerAddress('A', 'custom.example.com:25570')
    const args = []
    const launch = builder(api)
    launch._processAutoConnectArg(args)
    const status = Address.resolve(original, api.getServerAddress('A'))
    assert.equal(args.join(' '), `--server ${status.hostname} --port ${status.port}`)
})

test('modern Minecraft uses bracketed IPv6 and Auto Connect can be disabled', () => {
    const { api } = configFixture()
    api.setServerAddress('A', '[::1]:25570')
    const profile = { ...original, rawServer: { ...original.rawServer, minecraftVersion: '1.20.1', autoconnect: false } }
    const args = []
    builder(api, profile)._processAutoConnectArg(args)
    assert.equal(args.join(' '), '--quickPlayMultiplayer [::1]:25570')
    api.setAutoConnect(false)
    const disabled = []
    builder(api, profile)._processAutoConnectArg(disabled)
    assert.equal(disabled.length, 0)
})

test('settings template has address, default reset, help and validation message', () => {
    const ejs = localRequire('ejs')
    const html = ejs.render(fs.readFileSync(path.join(__dirname, '../app/settings.ejs'), 'utf8'), { lang: () => '', brand: {} })
    assert(html.includes('id="settingsServerAddress"'))
    assert(html.includes('id="settingsServerAddressReset"'))
    assert(html.includes('id="settingsServerAddressError" role="alert" hidden'))
})
