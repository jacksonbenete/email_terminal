Changelog
---------

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).


## not released yet

### Changed
- ⚠️ `software` programs are now defined in a single `software.json` file,
  in order to allow their enumeration for tab-completion & `help` output

### Added
- `software` programs `messages` can now include **images** 🖼️,
  with an optional glitch effect
- `software` programs `messages` can now include text with an optional effects:
  `desync`, `shimmer`, `glow` or `hack-reveal`.
- tab-completion of command names
- `help` now also lists custom `software` programs
- storing the commands history in the browser `localStorage`
- allowing to configure the initial content of a user commands history

### Fixed
- `delayed` configuration entry for `software` programs is now working correctly


## 2020 Apr 4

### Added
- You can now configure and access extra servers at `network.json` to login via `telnet`.
  Each server will treat their respective users (and mail messages) separatedly.
- New folders system: `network/` & `software/`
