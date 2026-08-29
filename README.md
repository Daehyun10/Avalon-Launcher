<p align="right">
  <strong>English</strong> · <a href="./README.ko.md">한국어</a>
</p>

<p align="center">
  <img src="./app/assets/images/avalon/avalon-logo.png" width="420" alt="AVALON logo">
</p>

<h1 align="center">AVALON Launcher</h1>

<p align="center">
  <a href="https://github.com/Daehyun10/Avalon-Launcher/releases/latest"><img src="https://img.shields.io/github/v/release/Daehyun10/Avalon-Launcher?style=flat-square&label=release" alt="Latest release"></a>
  <a href="https://github.com/Daehyun10/Avalon-Launcher/actions/workflows/build.yml"><img src="https://img.shields.io/github/actions/workflow/status/Daehyun10/Avalon-Launcher/build.yml?style=flat-square&label=build" alt="Windows build"></a>
  <a href="./LICENSE.txt"><img src="https://img.shields.io/badge/license-MIT-b08d57?style=flat-square" alt="MIT License"></a>
</p>

AVALON Launcher installs, updates, and starts the AVALON Minecraft client. The current release is built for Windows x64 and Minecraft 1.20.1.

## Download

Download the Windows installer from the [latest release](https://github.com/Daehyun10/Avalon-Launcher/releases/latest).

| Platform | File | Availability |
| --- | --- | --- |
| Windows x64 | `AVALON-Launcher-Setup-VERSION.exe` | Available |
| macOS | DMG | Not published |
| Linux x64 | AppImage | Not published |

The Windows installer is not code-signed yet. Windows SmartScreen may show a warning on first run. Check that the file came from this repository before opening it.

## Current Status

The included development configuration uses `localhost` as the server address. The launcher will show `SERVER OFFLINE` until a Minecraft server is running on the same computer or the address is changed to the live server.

The distribution file does not include the production mod list yet.

## Functions

- Microsoft account sign-in and account switching
- Java executable and memory settings
- Java 17 x64 checks for the current Minecraft version
- Minecraft client, library, asset, and module checks
- Direct connection to the configured server
- Launcher updates through GitHub Releases
- Windows installer builds through GitHub Actions

## Automatic Updates

Installed release builds check this repository for a newer version. When an update is available, the launcher downloads it and installs it when the launcher closes or restarts.

A release must contain these files:

- `AVALON-Launcher-Setup-VERSION.exe`
- `AVALON-Launcher-Setup-VERSION.exe.blockmap`
- `latest.yml`

The workflow in `.github/workflows/build.yml` creates these files when a tag beginning with `v` is pushed.

## Server Setup

For local testing, edit `app/assets/distribution_dev.json`.

1. Change `address` to the server hostname or IP address.
2. Check the Minecraft version and Java range.
3. Add Forge, libraries, mods, and other required modules.
4. Test installation, file checks, and server connection.

For a hosted distribution file, set `AVALON_DISTRIBUTION_URL` or set `remoteDistributionUrl` in `app/assets/js/brand.js`.

## Development

### Requirements

- Node.js 22
- npm
- Java 17 x64 for the current Minecraft 1.20.1 configuration

### Install and run

```powershell
git clone https://github.com/Daehyun10/Avalon-Launcher.git
cd Avalon-Launcher
npm ci
npm start
```

### Check and build

```powershell
npm run lint
npm run dist:win
```

Build files are written to `dist/`.

## Publish a Release

Update the version in `package.json` and `package-lock.json`, commit the change, and push a matching tag.

```powershell
git tag -a v0.1.8 -m "AVALON Launcher v0.1.8"
git push origin main
git push origin v0.1.8
```

GitHub Actions builds the installer and adds it to the release created for the tag.

## Main Files

```text
app/                         Launcher pages and code
app/assets/distribution_dev.json
                             Local server and Minecraft configuration
app/assets/images/avalon/    AVALON images
build/                       Installer icon and build resources
index.js                     Electron main process and updater
electron-builder.yml         Installer and release settings
.github/workflows/build.yml  Windows release workflow
```

## Credits

This project is based on [HeliosLauncher](https://github.com/dscalzi/HeliosLauncher) by [Daniel Scalzi](https://github.com/dscalzi). The original copyright notice remains in `LICENSE.txt`.

Minecraft is a trademark of Microsoft Corporation. This project is not affiliated with Mojang Studios or Microsoft.

## License

The source code is distributed under the [MIT License](./LICENSE.txt). Keep the copyright and license notice when copying or distributing the code.

The AVALON name, logo, images, music, fonts, and other project files may have separate terms. Use only files that you own or have permission to distribute.
