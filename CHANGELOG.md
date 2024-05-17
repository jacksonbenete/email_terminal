Changelog
---------

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).


## not released yet

### Added
- new example software programs: `demo.exe`, `target.exe`, `artifact`, `decrypt` & `identify`
- new kernel commands: `echo`, `exit`, `history`
- `software` programs logic can now be defined as Javascript code in `software.js`
- `software` programs `messages` can now include **images** 🖼️, with an optional `glitch` / `particule` effect
- `software` programs `messages` can now include text with an optional effects:
  `desync`, `shimmer`, `glow` or `hack-reveal`.
- new supported configurations fields in `manifest.json` : `iconSize`, `iconClass`, `headerExtraHTML`
- storing the commands history in the browser `localStorage`
- allowing to configure the initial content of a user commands history
- tab-completion of command names
- `help` now also lists custom `software` programs (unless they have `secretCommand` set)

### Changed
- a new system `ssh` command replaces the old `telnet` + `login` system.
  This avoids strange states where a user could be logged anonymously on a server.
- ⚠️ `software` programs are now defined in a single `software.json` file,
  in order to allow their enumeration for tab-completion & `help` output

### Fixed
- `delayed` configuration entry for `software` programs is now working correctly

### Deprecated
- `telnet` & `logout` system commands


## 2020 Apr 4

### Added
- You can now configure and access extra servers at `network.json` to login via `telnet`.
  Each server will treat their respective users (and mail messages) separatedly.
- New folders system: `network/` & `software/`
