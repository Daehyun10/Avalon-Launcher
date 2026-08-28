const { DistributionAPI } = require('helios-core/common')

const ConfigManager = require('./configmanager')
const BRAND = require('./brand')

exports.REMOTE_DISTRO_URL = BRAND.remoteDistributionUrl

const api = new DistributionAPI(
    ConfigManager.getLauncherDirectory(),
    null, // Injected forcefully by the preloader.
    null, // Injected forcefully by the preloader.
    exports.REMOTE_DISTRO_URL,
    !BRAND.remoteDistributionUrl
)

exports.DistroAPI = api
