#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![
      set_companion_always_on_top,
      set_companion_decorations,
      set_companion_opacity,
      reset_companion_position
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn set_companion_always_on_top(window: tauri::Window, enabled: bool) -> Result<(), String> {
  window
    .set_always_on_top(enabled)
    .map_err(|error| error.to_string())
}

#[tauri::command]
fn set_companion_decorations(window: tauri::Window, enabled: bool) -> Result<(), String> {
  window
    .set_decorations(enabled)
    .map_err(|error| error.to_string())
}

#[tauri::command]
fn set_companion_opacity(_window: tauri::Window, _opacity: f64) -> Result<(), String> {
  Err("Window opacity is handled by the web stage fallback; this Tauri Window API version does not expose native set_opacity.".into())
}

#[tauri::command]
fn reset_companion_position(window: tauri::Window) -> Result<(), String> {
  window
    .set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: 80, y: 80 }))
    .map_err(|error| error.to_string())
}
