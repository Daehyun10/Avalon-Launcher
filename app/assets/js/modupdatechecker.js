'use strict'

const fs = require('node:fs')
const crypto = require('node:crypto')
const got = require('got')
const { HeliosDistribution } = require('helios-core/common')
const { Type } = require('helios-distribution-types')

const MOD_TYPES = new Set([Type.ForgeMod, Type.FabricMod, Type.LiteMod, Type.LiteLoader])

function hashFile(file) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5')
        const stream = fs.createReadStream(file)
        stream.on('error', reject)
        stream.on('data', data => hash.update(data))
        stream.on('end', () => resolve(hash.digest('hex')))
    })
}

async function inspectMod(module) {
    const artifact = module.rawModule.artifact
    const result = {
        id: module.rawModule.id,
        name: module.rawModule.name,
        version: module.getMavenComponents().version
    }
    try {
        const file = module.getPath()
        const stat = await fs.promises.stat(file)
        if(!stat.isFile()) return { ...result, status: 'unreadable' }
        if(Number.isFinite(artifact.size) && stat.size !== artifact.size) return { ...result, status: 'outdated' }
        if(typeof artifact.MD5 !== 'string' || !/^[a-f0-9]{32}$/i.test(artifact.MD5)) return { ...result, status: 'unverified' }
        const actual = await hashFile(file)
        return { ...result, status: actual === artifact.MD5.toLowerCase() ? 'current' : 'outdated' }
    } catch(error) {
        return { ...result, status: error.code === 'ENOENT' ? 'missing' : 'unreadable' }
    }
}

async function fetchCatalog(url) {
    if(!url) throw new Error('No remote mod catalog configured.')
    return got.get(url, {
        responseType: 'json',
        searchParams: { _avalon_check: Date.now() },
        timeout: { request: 10000 },
        retry: { limit: 0 }
    }).then(response => response.body)
}

async function check({ remoteUrl, serverId, commonDir, instanceDir, loadCatalog = fetchCatalog }) {
    // This request deliberately does not use the cached/offline fallback catalog.
    const raw = await loadCatalog(remoteUrl)
    const distribution = new HeliosDistribution(raw, commonDir, instanceDir)
    const server = distribution.getServerById(serverId)
    if(server == null) {
        const error = new Error('This profile is not present in the latest mod catalog.')
        error.code = 'PROFILE_MISSING'
        throw error
    }
    const modules = []
    function collect(items) {
        for(const item of items) {
            if(MOD_TYPES.has(item.rawModule.type)) modules.push(item)
            collect(item.subModules)
        }
    }
    collect(server.modules)
    const results = []
    for(const module of modules) results.push(await inspectMod(module))
    return { serverId, checkedAt: new Date(), mods: results }
}

module.exports = { check, inspectMod, fetchCatalog }
