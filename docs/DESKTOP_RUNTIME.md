# Desktop Runtime

## v0.4 Behavior

The desktop app has two modes:

- `pnpm dev:desktop`: desktop-shaped Vite shell for fast UI inspection.
- `pnpm dev:desktop:tauri`: native Tauri wrapper when Rust and Tauri prerequisites are installed.

## Native Configuration

`apps/desktop/src-tauri/tauri.conf.json` configures the main window with:

- Transparent background.
- Decorations disabled.
- Resizable window with minimum compact dimensions.
- Centered launch.
- Shadow enabled.

`apps/desktop/src-tauri/src/lib.rs` exposes commands for:

- Always-on-top.
- Decorations on/off.
- Opacity.
- Position reset.

## Safe Fallbacks

Click-through is not enabled in v0.4. It has platform-specific behavior and can cause interaction ambiguity. The product fallback is:

- Compact floating mode.
- Full stage mode.
- Opacity control.
- Lock/unlock dragging intent.
- Hide/peek mode.
- Position reset.

The browser shell simulates these controls. Native validation requires `pnpm dev:desktop:tauri` on each target OS.

## Known Limitations

- Tauri Stronghold is not bundled yet.
- Native click-through is not implemented.
- Always-on-top and transparency must be validated per OS/window manager.
- App signing, notarization, installer packaging, and updater flow are not implemented.
