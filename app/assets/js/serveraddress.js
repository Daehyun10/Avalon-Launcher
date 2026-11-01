'use strict'

const { isIP } = require('node:net')
const { domainToASCII } = require('node:url')

function formatAddress(hostname, port) {
    return `${isIP(hostname) === 6 ? `[${hostname}]` : hostname}:${port}`
}

function parseAddress(value) {
    if(typeof value !== 'string') throw new Error('Enter a server address.')
    const input = value.trim()
    if(input === '') return null
    if(input.length > 260 || /[\s/\\?#@%]/.test(input)) throw new Error('Use a hostname or IP address, without a URL prefix or path.')
    let hostname = input
    let portText
    if(input.startsWith('[')) {
        const match = /^\[([^\]]+)\](?::([^:]+))?$/.exec(input)
        if(!match || isIP(match[1]) !== 6) throw new Error('Use [IPv6]:port for an IPv6 address with a port.')
        hostname = match[1]
        portText = match[2]
    } else if(isIP(input) !== 6 && input.includes(':')) {
        const parts = input.split(':')
        if(parts.length !== 2) throw new Error('Use hostname:port or [IPv6]:port.')
        hostname = parts[0]
        portText = parts[1]
    }
    const port = portText === undefined ? 25565 : Number(portText)
    if((portText !== undefined && !/^\d{1,5}$/.test(portText)) || !Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('Port must be between 1 and 65535.')
    }
    if(!isIP(hostname)) {
        hostname = domainToASCII(hostname).toLowerCase()
        const labels = hostname.replace(/\.$/, '').split('.')
        if(!hostname || hostname.length > 253 || /^[\d.]+$/.test(hostname) || labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
            throw new Error('Enter a valid hostname or IP address.')
        }
    }
    hostname = hostname.toLowerCase()
    return { hostname, port, address: formatAddress(hostname, port) }
}

function isValid(value) {
    try {
        parseAddress(value)
        return true
    } catch {
        return false
    }
}

function resolve(server, override = '') {
    const custom = parseAddress(override)
    return custom != null ? { ...custom, autoconnect: true } : {
        hostname: server.hostname,
        port: server.port,
        address: formatAddress(server.hostname, server.port),
        autoconnect: server.rawServer.autoconnect
    }
}

module.exports = { parseAddress, isValid, resolve }
