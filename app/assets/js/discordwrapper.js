const { LoggerUtil } = require('helios-core')

const logger = LoggerUtil.getLogger('DiscordWrapper')

const { Client } = require('discord-rpc-patch')

const Lang = require('./langloader')

let session = null

function logFailure(error) {
    logger.info('Discord Rich Presence unavailable: ' + error.message)
}

function publish(current) {
    if(session !== current || !current.ready) return
    return current.client.setActivity({ ...current.activity }, current.pid).catch(logFailure)
}

exports.initRPC = function(genSettings, servSettings, initialDetails = Lang.queryJS('discord.waiting'), processId = process.pid){
    exports.shutdownRPC()
    if(!genSettings?.clientId || !servSettings) {
        logger.info('Discord RPC disabled: no AVALON client configuration.')
        return false
    }
    const client = new Client({ transport: 'ipc' })
    const activity = {
        details: initialDetails,
        state: Lang.queryJS('discord.state', {shortId: servSettings.shortId}),
        largeImageKey: servSettings.largeImageKey,
        largeImageText: servSettings.largeImageText,
        smallImageKey: genSettings.smallImageKey,
        smallImageText: genSettings.smallImageText,
        startTimestamp: new Date().getTime(),
        instance: false
    }
    const current = { client, activity, pid: processId, ready: false }
    session = current

    client.on('ready', () => {
        if(session !== current) return
        current.ready = true
        logger.info('Discord RPC Connected')
        publish(current)
    })
    client.on('error', logFailure)
    client.on('disconnected', () => {
        current.ready = false
    })
    client.login({clientId: genSettings.clientId}).catch(logFailure)
    return true
}

exports.updateDetails = function(details){
    if(session == null) return
    session.activity.details = details
    return publish(session)
}

exports.shutdownRPC = function(){
    if(session == null) return
    const current = session
    session = null
    return (async () => {
        try {
            if(current.ready) await current.client.clearActivity(current.pid)
        } catch(error) {
            logFailure(error)
        } finally {
            try {
                await current.client.destroy()
            } catch(error) {
                logFailure(error)
            }
        }
    })()
}
