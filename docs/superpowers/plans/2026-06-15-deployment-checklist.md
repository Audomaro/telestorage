# TeleStorage Real-World Deployment Checklist

This checklist tracks the remaining work to turn TeleStorage into a production-ready Electron application for Windows.

## A. Trust & installer experience
_Status: skipped (no code-signing certificate)_

- [ ] ~~Purchase/obtain Windows code-signing certificate (OV or EV)~~ — skipped
- [ ] ~~Configure `publisherName` once signing is set up~~ — skipped
- [x] Replace placeholder `appId` with real reverse-domain identifier — covered in B design
- [x] Replace placeholder `copyright` with author name — already done
- [ ] ~~Sign NSIS installer and portable `.exe`~~ — skipped
- [ ] ~~Verify Windows SmartScreen on clean VM~~ — skipped
- [x] Add publisher info to Add/Remove Programs — done via `nsis.shortcutName` and `nsis.uninstallDisplayName`

## B. Updates & distribution
_Status: pipeline implemented, pending secrets and first tag push_

- [x] Auto-updater check on startup
- [x] GitHub Actions release pipeline (build + publish on tag push)
- [x] Update `publish.owner` and `publish.repo` in `electron-builder.yml`
- [x] Ship production `.env` via `extraResources`
- [x] Load `.env` from `process.resourcesPath` in main process
- [ ] In-app update progress / "Update available" dialog
- [ ] Support release channels (stable / beta / alpha)
- [ ] Generated release notes
- [ ] Differential / delta updates

## C. Monitoring & stability
_Status: future work_

- [ ] Crash reporting integration (Sentry or Electron `crashReporter`)
- [ ] Structured error logging in production
- [ ] Opt-in usage analytics
- [ ] Main-process unhandled exception / rejection handlers
- [ ] Health checks / heartbeat

## D. Distribution channels
_Status: future work_

- [ ] Website download page with version info
- [ ] Microsoft Store submission
- [ ] Winget manifest
- [ ] Chocolatey package
- [ ] Clear portable vs. installer strategy

## E. Security & secrets
_Status: future work_

- [x] Decide how `.env` / Telegram API credentials ship in production — covered in B design
- [ ] Review `webSecurity`, CSP, and preload isolation
- [ ] Secure storage for user session data
- [ ] Auto-updater signature verification (handled by `electron-updater`)
- [ ] Dependency audit and automated `npm audit` in CI

## Notes

- Code signing is intentionally deferred due to cost. Expect Windows SmartScreen warnings until a certificate is added.
- The `.env` strategy embeds `TELEGRAM_API_HASH` in the distributed package, which is standard for desktop Telegram clients but not perfectly secret.
