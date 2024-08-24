use russh::client::{self, connect, Handle, Handler};
use russh::client::Config;
use russh::{Channel, Disconnect};
use thiserror::Error;
use std::sync::Arc;
use std::time::Duration;

#[derive(Error, Debug)]
pub enum SshError {
    #[error("{0}")]
    RusshError(#[from] russh::Error),

    #[error("SSH client is not connected.")]
    DisconnectedError,

    #[error("Command error: {0}")]
    CommandError(String),

    #[error("{0}")]
    Other(String),
}

impl serde::Serialize for SshError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

struct ClientHandler {
    channel: Option<Channel<client::Msg>>,
}

impl Handler for ClientHandler {
    type Error = russh::Error;
}
pub struct SshService {
    client: Option<Handle<ClientHandler>>,
}

impl SshService {
    pub fn new() -> Self {
        SshService { client: None }
    }

    pub async fn connect(
        &mut self,
        url: &str,
        username: &str,
        password: &str,
    ) -> Result<(), SshError> {
        let config = Arc::new(Config {
            inactivity_timeout: Some(Duration::from_secs(5)),
            ..Default::default()
        });
        let mut session = connect(config, url, ClientHandler { channel: None }).await?;
        session.authenticate_password(username, password).await?;

        self.client = Some(session);
        Ok(())
    }

    pub async fn execute_command(
        &mut self,
        command: &str,
        stdin_data: Option<&[u8]>,
    ) -> Result<Option<String>, SshError> {
        let client = self.client.as_mut().ok_or(SshError::DisconnectedError)?;

        let mut channel = client.channel_open_session().await?;
        channel.exec(true, command).await?;

        if let Some(data) = stdin_data {
            channel.data(data).await?;
        }

        channel.eof().await?;

        while let Some(msg) = channel.wait().await {
            match msg {
                russh::ChannelMsg::Data { ref data: chunk } => {
                    output.extend_from_slice(chunk);
                }
                russh::ChannelMsg::ExitStatus { exit_status } => {
                    if exit_status == 0 {
                        return Ok(Some(String::from_utf8_lossy(&output).to_string()));
                    } else {
                        return Err(SshError::CommandError(
                            String::from_utf8_lossy(&output).to_string(),
                        ));
                    }
                }
                _ => {}
            }
        }

        Ok(None)
    }

    pub async fn disconnect(&mut self) -> Result<(), SshError> {
        if let Some(client) = self.client.take() {
            client.disconnect(Disconnect::ByApplication, "", "English").await?;
        }
        Ok(())
    }
}
