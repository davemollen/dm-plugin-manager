use async_ssh2_tokio::client::{AuthMethod, Client, ServerCheckMethod};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum SshError {
    #[error("{0}")]
    SshError(#[from] async_ssh2_tokio::Error),

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

#[derive(Clone)]
pub struct SshService {
    client: Option<Client>,
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
        let auth_method = AuthMethod::with_password(password);
        let client =
            Client::connect((url, 22), username, auth_method, ServerCheckMethod::NoCheck).await?;
        self.client = Some(client);
        Ok(())
    }

    pub async fn execute_command(&mut self, command: &str) -> Result<Option<String>, SshError> {
        let client = self.client.as_mut().ok_or(SshError::DisconnectedError)?;
        let response = client.execute(command).await?;
        if response.exit_status == 0 {
            Ok(Some(response.stdout))
        } else {
            Err(SshError::CommandError(response.stderr))
        }
    }

    pub async fn disconnect(&mut self) -> Result<(), SshError> {
        if let Some(client) = self.client.take() {
            client.disconnect().await?;
        }
        Ok(())
    }
}
