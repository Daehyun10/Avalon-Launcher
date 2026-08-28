'use strict'

/**
 * User-facing AVALON identity and optional service endpoints.
 * Empty optional values disable their associated integration safely.
 */
module.exports = Object.freeze({
    name: 'AVALON',
    launcherName: 'AVALON Launcher',
    appId: 'com.avalon.launcher',
    serverName: 'AVALON',
    serverAddress: process.env.AVALON_SERVER_ADDRESS || 'localhost',
    website: process.env.AVALON_WEBSITE_URL || '',
    discord: process.env.AVALON_DISCORD_URL || '',
    support: process.env.AVALON_SUPPORT_URL || '',
    remoteDistributionUrl: process.env.AVALON_DISTRIBUTION_URL || '',
    discordClientId: process.env.AVALON_DISCORD_CLIENT_ID || '',
    updateRepository: process.env.AVALON_UPDATE_REPOSITORY || 'https://github.com/Daehyun10/Avalon-Launcher',
    autoUpdateEnabled: process.env.AVALON_AUTO_UPDATE !== 'false'
})
