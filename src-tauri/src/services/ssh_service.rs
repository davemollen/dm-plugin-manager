use async_trait::async_trait;
use futures::AsyncWriteExt;
use russh::client::{connect, Handle, Handler};
use russh::keys::key;
use russh::Disconnect;
use std::sync::Arc;
use std::time::Duration;
use thiserror::Error;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct CommandExecutedResult {
    /// The stdout output of the command.
    pub stdout: String,
    /// The stderr output of the command.
    pub stderr: String,
    /// The unix exit status (`$?` in bash).
    pub exit_status: u32,
}

#[derive(Error, Debug)]
pub enum SshError {
    #[error("{0}")]
    RusshError(#[from] russh::Error),

    #[error("The executed command didn't send an exit code")]
    CommandDidntExit,

    #[error("Ssh command error: {0}")]
    CommandError(String),
}

struct ClientHandler;

#[async_trait]
impl Handler for ClientHandler {
    type Error = russh::Error;

    async fn check_server_key(
        &mut self,
        _server_public_key: &key::PublicKey,
    ) -> Result<bool, Self::Error> {
        Ok(true)
    }
}

pub struct SshService {
    client: Arc<Handle<ClientHandler>>,
}

impl SshService {
    pub async fn connect(url: &str, username: &str, password: &str) -> Result<Self, SshError> {
        let config = Arc::new(russh::client::Config {
            inactivity_timeout: Some(Duration::from_secs(5)),
            ..Default::default()
        });

        let mut session = connect(config, (url, 22), ClientHandler {}).await?;
        session.authenticate_password(username, password).await?;

        Ok(SshService {
            client: Arc::new(session),
        })
    }

    pub async fn execute_command(
        &self,
        command: &str,
        stdin_data: Option<&[u8]>,
    ) -> Result<String, SshError> {
        let mut stdout_buffer = vec![];
        let mut stderr_buffer = vec![];
        let mut exit_status_result: Option<u32> = None;

        let mut channel = self.client.channel_open_session().await?;
        channel.exec(true, command).await?;

        if let Some(data) = stdin_data {
            channel.data(data).await?;
        }

        channel.eof().await?;

        while let Some(msg) = channel.wait().await {
            match msg {
                russh::ChannelMsg::Data { ref data } => {
                    stdout_buffer.write_all(data).await.unwrap();
                }
                russh::ChannelMsg::ExtendedData { ref data, ext } => {
                    if ext == 1 {
                        stderr_buffer.write_all(data).await.unwrap();
                    }
                }
                russh::ChannelMsg::ExitStatus { exit_status } => {
                    exit_status_result = Some(exit_status);
                }
                _ => {}
            }
        }

        if let Some(exit_status_result) = exit_status_result {
            if exit_status_result != 0 {
                let stderr = String::from_utf8_lossy(&stderr_buffer).to_string();
                Err(SshError::CommandError(stderr))
            } else {
                let stdout = String::from_utf8_lossy(&stdout_buffer).to_string();
                Ok(stdout)
            }
        } else {
            Err(SshError::CommandDidntExit)
        }
    }

    pub async fn disconnect(&self) -> Result<(), SshError> {
        self.client
            .disconnect(Disconnect::ByApplication, "", "English")
            .await?;
        Ok(())
    }
}
