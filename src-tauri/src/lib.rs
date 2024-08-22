use ssh2::Session;
use std::io::prelude::*;
use std::net::TcpStream;
use tauri::Manager;

#[tauri::command]
fn get_plugins() -> Result<Vec<String>, String> {
    let tcp = TcpStream::connect("192.168.51.1:22").unwrap();
    let mut sess = Session::new().unwrap();
    sess.set_tcp_stream(tcp);
    sess.handshake().unwrap();

    sess.userauth_password("root", "mod").unwrap();
    assert!(sess.authenticated());

    let mut channel = sess.channel_session().unwrap();
    channel.exec("cd .lv2 && ls").unwrap();
    let mut result = String::new();
    channel.read_to_string(&mut result).unwrap();
    let plugins = result.split("\n").map(|item| item.to_string()).collect();

    channel.wait_close().unwrap();

    Ok(plugins)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }
            Ok(())
        })
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Webview,
                ))
                .build(),
        )
        .invoke_handler(tauri::generate_handler![get_plugins])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
