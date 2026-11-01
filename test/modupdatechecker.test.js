const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const vm = require('node:vm')
const { test } = require('node:test')
const { HeliosDistribution } = require('helios-core/common')
const Checker = require('../app/assets/js/modupdatechecker')

const digest = bytes => crypto.createHash('md5').update(bytes).digest('hex')

function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'avalon-mod-check-'))
    t.after(() => fs.rmSync(root, { recursive: true, force: true }))
    const bytes = Buffer.from('latest-mod-content')
    const mod = {
        id: 'com.avalon:example:1.0.0@jar', name: 'Example', type: 'ForgeMod',
        artifact: { size: bytes.length, MD5: digest(bytes), url: 'https://example.com/mod.jar', path: 'example.jar' }
    }
    const catalog = { version: '1.0.0', servers: [{
        id: 'A', name: 'AVALON', address: 'localhost', minecraftVersion: '1.18.2',
        modules: [mod], mainServer: true, autoconnect: true
    }] }
    const options = { remoteUrl: 'https://example.com/catalog.json', serverId: 'A', commonDir: root, instanceDir: root, loadCatalog: async () => catalog }
    const module = new HeliosDistribution(catalog, root, root).getServerById('A').modules[0]
    fs.mkdirSync(path.dirname(module.getPath()), { recursive: true })
    return { root, bytes, mod, catalog, options, module }
}

test('installed bytes matching latest hash are up to date', async t => {
    const f = fixture(t)
    fs.writeFileSync(f.module.getPath(), f.bytes)
    const result = await Checker.check(f.options)
    assert.equal(result.mods[0].status, 'current')
    assert.equal(result.mods[0].version, '1.0.0')
    assert(result.checkedAt instanceof Date)
})

test('same version and same size with changed contents requires an update', async t => {
    const f = fixture(t)
    fs.writeFileSync(f.module.getPath(), Buffer.alloc(f.bytes.length, 65))
    const result = await Checker.check(f.options)
    assert.equal(result.mods[0].version, '1.0.0')
    assert.equal(result.mods[0].status, 'outdated')
})

test('missing files and wrong-size files have distinct states', async t => {
    const f = fixture(t)
    assert.equal((await Checker.check(f.options)).mods[0].status, 'missing')
    fs.writeFileSync(f.module.getPath(), 'old')
    assert.equal((await Checker.check(f.options)).mods[0].status, 'outdated')
})

test('missing checksum never claims latest status', async t => {
    const f = fixture(t)
    delete f.mod.artifact.MD5
    fs.writeFileSync(f.module.getPath(), f.bytes)
    assert.equal((await Checker.check(f.options)).mods[0].status, 'unverified')
})

test('offline lookup rejects instead of silently checking a cached catalog', async t => {
    const f = fixture(t)
    fs.writeFileSync(f.module.getPath(), f.bytes)
    f.options.loadCatalog = async () => { throw new Error('offline') }
    await assert.rejects(Checker.check(f.options), /offline/)
})

test('fresh catalog selects the new Maven version and detects an uninstalled update', async t => {
    const f = fixture(t)
    fs.writeFileSync(f.module.getPath(), f.bytes)
    f.mod.id = 'com.avalon:example:1.1.0@jar'
    f.mod.artifact.path = 'new-version.jar'
    const result = await Checker.check(f.options)
    assert.equal(result.mods[0].version, '1.1.0')
    assert.equal(result.mods[0].status, 'missing')
})

test('mods nested under loaders are checked without modifying optional settings', async t => {
    const f = fixture(t)
    f.mod.required = { value: false, def: false }
    f.catalog.servers[0].modules = [{
        id: 'com.avalon:loader:1.0.0', name: 'Loader', type: 'ForgeHosted',
        artifact: { size: 1, url: 'https://example.com/loader.jar' }, subModules: [f.mod]
    }]
    const before = JSON.stringify(f.catalog)
    const result = await Checker.check(f.options)
    assert.equal(result.mods.length, 1)
    assert.equal(result.mods[0].status, 'missing')
    assert.equal(JSON.stringify(f.catalog), before)
})

test('missing profile fails and invalid file paths are not marked current', async t => {
    const f = fixture(t)
    await assert.rejects(Checker.check({ ...f.options, serverId: 'unknown' }), /not present/)
    fs.mkdirSync(f.module.getPath())
    assert.equal((await Checker.check(f.options)).mods[0].status, 'unreadable')
})

function uiFixture(check) {
    const element = () => ({ textContent: '', dataset: {}, children: [], disabled: false,
        setAttribute() {}, removeAttribute() {},
        replaceChildren() { this.children = [] }, append(...items) { this.children.push(...items) }
    })
    const elements = Object.fromEntries(['settingsModUpdateCheck', 'settingsModUpdateSummary', 'settingsModUpdateList'].map(id => [id, element()]))
    let profile = 'A'
    const context = {
        document: { getElementById: id => elements[id], createElement: element },
        ConfigManager: { getSelectedServer: () => profile, getCommonDirectory: () => '/common', getInstanceDirectory: () => '/instances' },
        DistroAPI: { isDevMode: () => false }, SETTINGS_BRAND: { remoteDistributionUrl: 'https://example.com/catalog' },
        ModUpdateChecker: { check }, loggerModUpdates: { warn() {} }
    }
    const source = fs.readFileSync(path.join(__dirname, '../app/assets/js/scripts/settings.js'), 'utf8')
    const start = source.indexOf('let modUpdateCheckId = 0')
    vm.runInNewContext(source.slice(start, source.indexOf('/**', start)), context)
    return { context, elements, select: id => { profile = id } }
}

test('settings renders per-mod status and enables checking again', async () => {
    const f = uiFixture(async () => ({ checkedAt: new Date(), mods: [{ name: 'Example', version: '1.0.0', status: 'outdated' }] }))
    await f.context.checkModUpdates()
    assert.equal(f.elements.settingsModUpdateCheck.disabled, false)
    assert.equal(f.elements.settingsModUpdateList.children[0].children[1].textContent, 'Update required')
    assert(f.elements.settingsModUpdateSummary.textContent.includes('1 mod needs'))
})

test('settings removes stale latest results on network failure', async () => {
    const f = uiFixture(async () => { throw new Error('offline') })
    f.elements.settingsModUpdateSummary.textContent = 'All distributed mods are up to date.'
    await f.context.checkModUpdates()
    assert(f.elements.settingsModUpdateSummary.textContent.startsWith('Unable to check'))
    assert.equal(f.elements.settingsModUpdateList.children.length, 0)
    assert.equal(f.elements.settingsModUpdateCheck.disabled, false)
})

test('a delayed check for the previous profile cannot overwrite the current profile', async () => {
    const pending = {}
    const f = uiFixture(({ serverId }) => new Promise(resolve => { pending[serverId] = resolve }))
    const first = f.context.checkModUpdates()
    f.select('B')
    const second = f.context.checkModUpdates()
    pending.A({ checkedAt: new Date(), mods: [{ name: 'Old profile', version: '1', status: 'current' }] })
    await first
    assert.equal(f.elements.settingsModUpdateCheck.disabled, true)
    assert.equal(f.elements.settingsModUpdateList.children.length, 0)
    pending.B({ checkedAt: new Date(), mods: [{ name: 'New profile', version: '2', status: 'current' }] })
    await second
    assert(f.elements.settingsModUpdateList.children[0].children[0].textContent.startsWith('New profile'))
    assert.equal(f.elements.settingsModUpdateCheck.disabled, false)
})
