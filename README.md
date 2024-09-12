# DM Plugin Manager

With this Desktop app built with [Tauri](https://tauri.app/) you can install all DM plugins.
This includes VST3, CLAP and MOD audio plugins.

[Download the app for your operating system here](https://github.com/davemollen/dm-plugin-manager/releases).

## Development

Run `npm install` followed by `npx tauri dev` to start the application.

### Add plugins

Available plugins are managed in the [dm-plugins.json file](./src-tauri/resources/dm-plugins.json)

### Release

1. Bump the versions in the [tauri.conf.json](./src-tauri/tauri.conf.json), [Cargo.toml](./src-tauri/Cargo.toml) and [package.json](./package.json) file.
2. Update the [release-notes.txt](./release-notes.txt)
3. Commit and push changes
4. Publish the release on Github when ready
