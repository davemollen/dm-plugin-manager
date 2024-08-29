use async_trait::async_trait;
use russh::{client, keys::key, ChannelMsg, Disconnect};
use std::{sync::Arc, time::Duration};
use thiserror::Error;
use tokio::{io::AsyncWriteExt, time::timeout};

#[derive(Error, Debug)]
pub enum SshError {
    #[error("{0}")]
    RusshError(#[from] russh::Error),

    #[error("The executed command didn't send an exit code")]
    CommandDidntExit,

    #[error("Ssh command error: {0}")]
    CommandError(String),

    #[error("Unable to connect with MOD")]
    NoConnection,

    #[error("Ssh write to buffer failed: {0}")]
    WriteError(#[from] std::io::Error),
}

struct ClientHandler;

#[async_trait]
impl client::Handler for ClientHandler {
    type Error = russh::Error;

    async fn check_server_key(
        &mut self,
        _server_public_key: &key::PublicKey,
    ) -> Result<bool, Self::Error> {
        Ok(true)
    }
}

pub struct SshService {
    client: Arc<client::Handle<ClientHandler>>,
}

impl SshService {
    const CONNECTION_TIMEOUT: Duration = Duration::from_secs(5);

    pub async fn connect(url: &str, username: &str, password: &str) -> Result<Self, SshError> {
        let future = async {
            let config = Arc::new(client::Config::default());
            let mut session = client::connect(config, (url, 22), ClientHandler {}).await?;
            session.authenticate_password(username, password).await?;

            Ok(SshService {
                client: Arc::new(session),
            })
        };

        match timeout(Self::CONNECTION_TIMEOUT, future).await {
            Ok(result) => result,
            Err(_) => Err(SshError::NoConnection),
        }
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
                ChannelMsg::Data { ref data } => {
                    stdout_buffer.write_all(data).await?;
                }
                ChannelMsg::ExtendedData { ref data, ext } => {
                    if ext == 1 {
                        stderr_buffer.write_all(data).await?;
                    }
                }
                ChannelMsg::ExitStatus { exit_status } => {
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
