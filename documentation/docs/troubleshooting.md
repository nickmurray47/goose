---
title: Troubleshooting
---

# Troubleshooting

goose, like any system, may run into occasional issues. This guide provides solutions for common problems.

### goose Edits Files
goose can and will edit files as part of its workflow. To avoid losing personal changes, use version control to stage your personal edits. Leave goose edits unstaged until reviewed. Consider separate commits for goose's edits so you can easily revert them if needed.

---

### Interrupting goose
If goose is heading in the wrong direction or gets stuck, you can [interrupt it](/docs/guides/sessions/in-session-actions#interrupt-task) to correct its actions or provide additional information.

---

### Stuck in a Loop or Unresponsive
In rare cases, goose may enter a "doom spiral" or become unresponsive during a long session. This is often resolved by ending the current session, and starting a new session.

1. Hold down `Ctrl+C` to cancel
2. Start a new session:
  ```sh
  goose session
  ```
:::tip
For particularly large or complex tasks, consider breaking them into smaller sessions.
:::

---

### Preventing Long-Running Commands

If you use goose CLI and work with web development projects, you may encounter commands that cause goose to hang indefinitely. Commands like `npm run dev`, `python -m http.server`, or `webpack serve` start development servers that never exit on their own.

You can prevent these issues by customizing your shell to handle these commands differently when goose runs them. See [Customizing Shell Behavior](/docs/guides/environment-variables#customizing-shell-behavior) for details on using the `GOOSE_TERMINAL` environment variable.

---

### Debugging and Diagnostics

To help with troubleshooting issues, you can:

- View [session and system logs](/docs/guides/logs) for debugging individual sessions
- Configure [telemetry export](/docs/guides/environment-variables#observability) for performance analysis, trend monitoring, or production/CI debugging

---

### Context Length Exceeded Error

This error occurs when the input provided to goose exceeds the maximum token limit of the LLM being used. To resolve this, try breaking down your input into smaller parts. You can also use [`.goosehints`][goosehints] as a way to provide goose with detailed context and use [message queues](/docs/guides/sessions/in-session-actions#queue-messages) in goose Desktop.

---

### Using Ollama Provider

Ollama provides local LLMs, which means you must first [download Ollama and run a model](/docs/getting-started/providers#local-llms) before attempting to use this provider with goose. If you do not have the model downloaded, you'll run into the following error:

> ExecutionError("error sending request for url (http://localhost:11434/v1/chat/completions)")


Another thing to note is that the DeepSeek models do not support tool calling, so all goose [extensions must be disabled](/docs/getting-started/using-extensions#enablingdisabling-extensions) to use one of these models. Unfortunately, without the use of tools, there is not much goose will be able to do autonomously if using DeepSeek. However, Ollama's other models such as `qwen2.5` do support tool calling and can be used with goose extensions.

---

### Handling Rate Limit Errors
goose may encounter a `429 error` (rate limit exceeded) when interacting with LLM providers. The recommended solution is to use a provider that provides built-in rate limiting. See [Handling LLM Rate Limits][handling-rate-limits] for more info.

---

### Hermit Errors

If you see an issue installing an extension in the app that says "hermit:fatal", you may need to reset your hermit cache. We use
a copy of hermit to ensure npx and uvx are consistently available. If you have already used an older version of hermit, you may
need to cleanup the cache - on Mac this cache is at

```
sudo rm -rf ~/Library/Caches/hermit
```

---

### API Errors

Users may run into an error like the one below when there are issues with their LLM API tokens, such as running out of credits or incorrect configuration:

```sh
Traceback (most recent call last):
  File "/Users/admin/.local/pipx/venvs/goose-ai/lib/python3.13/site-packages/exchange/providers/utils.py",
line 30, in raise_for_status
    response.raise_for_status()
    ~~~~~~~~~~~~~~~~~~~~~~~~~^^
  File "/Users/admin/.local/pipx/venvs/goose-ai/lib/python3.13/site-packages/httpx/_models.py",
line 829, in raise_for_status
    raise HTTPStatusError(message, request=request, response=self)
httpx.HTTPStatusError: Client error '404 Not Found' for url
'https://api.openai.com/v1/chat/completions'

...
```
This error typically occurs when LLM API credits are exhausted or your API key is invalid. To resolve this issue:

1. Check Your API Credits:
    - Log into your LLM provider's dashboard
    - Verify that you have enough credits. If not, refill them
2. Verify API Key:
    - Run the following command to reconfigure your API key:
    ```sh
    goose configure
    ```
For detailed steps on updating your LLM provider, refer to the [Installation][installation] Guide.

---

### GitHub Copilot Provider Configuration

If you encounter errors when configuring GitHub Copilot as your provider, try these workarounds for common scenarios.

#### OAuth Error with Lead/Worker Models

If the [lead/worker model](/docs/tutorials/lead-worker) feature is configured in your environment, you might see the following error during GitHub Copilot setup. This feature conflicts with the OAuth flow to connect to the provider.
```
Failed to authenticate: Execution error: OAuth configuration not supported by this provider
``` 

To resolve:
1. Temporarily comment out or remove lead/worker model variables from the main config file (`~/.config/goose/config.yaml`):
   ```yaml
   # GOOSE_LEAD_MODEL: your-model
   # GOOSE_WORKER_MODEL: your-model
   ```
2. Run `goose configure` again to set up GitHub Copilot
3. Complete the OAuth authentication flow
4. Re-enable your lead/worker model settings as needed

#### Container and Keyring Issues

If you're running goose in Docker containers or Linux environments without keyring support, authentication may fail with keyring errors like:
```
Failed to save token: Failed to access keyring: Platform secure storage failure: DBus error: Using X11 for dbus-daemon autolaunch was disabled at compile time
```

goose tries to use the system keyring (which requires DBus and X11) to securely store your GitHub token, but these aren't available in containerized or headless environments.

To resolve:

Use the `GOOSE_DISABLE_KEYRING` environment variable to tell goose to store secrets in files instead. This example sets the variable only while executing the `goose configure` command:

```bash
GOOSE_DISABLE_KEYRING=1 goose configure
```

See [Keychain/Keyring Errors](#keychainkeyring-errors) for more details on keyring alternatives.

---

### New Recipe Warning

The first time you run a given recipe in goose Desktop, you'll see a `New Recipe Warning` dialog that allows you to review the recipe's title, description, and instructions. If you trust the recipe, click `Trust and Execute` to continue. You won't be prompted again for the same recipe unless it changes.

This warning helps protect against inadvertently executing potentially harmful recipe code.

---
### Uninstall goose or Remove Cached Data

You may need to uninstall goose or clear existing data before re-installing. goose stores data in different locations depending on your operating system. Secrets, such as API keys, are stored exclusively in the system keychain/keyring.

#### macOS

**Data Locations**

- **Logs and Config**: `~/.config/goose`
- **Application Data**: `~/Library/Application Support/Goose`
- **Secrets**: macOS Keychain (credential named "goose").

#### Removal Steps

1. Stop any copies of goose running (CLI or GUI)

  - Consider confirming you've stopped them all via Activity Monitor

2. Open Keychain Access and delete the credential called "goose", which contains all secrets stored by goose
3. Remove data directories:

```
rm -rf ~/.config/goose
rm -rf ~/Library/Application\ Support/goose
```
4. Delete the "goose" app from your Applications folder (if using goose Desktop).

#### Linux
**Data Locations**

- **Data/Sessions**: `~/.local/share/goose/`
- **Logs**: `~/.local/state/goose/`
- **Config**: `~/.config/goose/`
- **Secrets**: System keyring (if available)

#### Removal Steps

- Stop any copies of goose running (CLI or GUI)
- Clear secrets from your system keyring (if applicable)
- Remove data directories:

```
rm -rf ~/.local/share/goose/
rm -rf ~/.local/state/goose/
rm -rf ~/.config/goose/
```
#### Windows

**Data Locations**
- **Configuration and Data**: `%APPDATA%\Block\goose\`
- **Local Application Data**: `%LOCALAPPDATA%\Block\goose\`
- **Secrets**: Windows Credential Manager

#### Removal Steps

1. Stop any copies of goose running (CLI or GUI)

  - Check Task Manager to confirm all instances are closed

2. Open Windows Credential Manager and delete credentials related to "goose"
3. Remove data directories:
```
rmdir /s /q "%APPDATA%\Block\goose"
rmdir /s /q "%LOCALAPPDATA%\Block\goose"
```
4. Uninstall the goose Desktop app from Settings > Apps (if applicable)

> After this cleanup, if you are looking to try out a fresh install of goose, you can now start from the usual install instructions.
---

### Keychain/Keyring Errors

goose tries to use the system keyring to store secrets. In environments where there is no keyring support, you may
see an error like:

```bash
Error Failed to access secure storage (keyring): Platform secure storage failure: DBus error: The name org.freedesktop.secrets was not provided by any .service files
Please check your system keychain and run 'goose configure' again.
If your system is unable to use the keyring, please try setting secret key(s) via environment variables.
```

In this case, you will need to set your provider specific environment variable(s), which can be found at [Supported LLM Providers][configure-llm-provider].

You can set them either by doing:
* `export GOOGLE_API_KEY=$YOUR_KEY_HERE` - for the duration of your session
* in your `~/.bashrc` or `~/.zshrc` - (or equivalents) so it persists on new shell each new session

Then select the `No` option when prompted to save the value to your keyring.

```bash
$ goose configure

Welcome to goose! Let's get you set up with a provider.
  you can rerun this command later to update your configuration

┌   goose-configure
│
◇  Which model provider should we use?
│  Google Gemini
│
◇  GOOGLE_API_KEY is set via environment variable
│
◇  Would you like to save this value to your keyring?
│  No
│
◇  Enter a model from that provider:
│  gemini-2.0-flash-exp
```

You may also use the `GOOSE_DISABLE_KEYRING` environment variable, which disables the system keyring for secret storage. Set to any value (e.g., "1", "true", "yes"), to disable. The actual value doesn't matter, only whether the variable is set.

When the keyring is disabled, secrets are stored here:

* macOS/Linux: `~/.config/goose/secrets.yaml`
* Windows: `%APPDATA%\Block\goose\config\secrets.yaml`

---

### Package Runners

Many of the external extensions require a package runner. For example, if you run into an error like this one:

```
Failed to start extension `{extension name}`: Could not run extension command (`{extension command}`): No such file or directory (os error 2)
Please check extension configuration for {extension name}.
```

... it signals that the extension may not have been installed and you need the package runner in order to do so.

An example is the GitHub extension whose command is `npx -y @modelcontextprotocol/server-github`. You'd need [Node.js](https://nodejs.org/) installed on your system to run this command, as it uses `npx`.

---

### Node.js Extensions Not Activating on Windows

If you encounter the error `Node.js installer script not found` when trying to activate Node.js-based extensions on Windows, this is likely due to goose not finding Node.js in the expected system path.

#### Symptoms:
- Node.js is installed and working (verified with `node -v` and `npm -v`)
- Other extensions (like Python-based ones) work fine
- Error occurs specifically when activating Node.js extensions

#### Solution:
This issue typically occurs when Node.js is installed in a non-standard location. goose expects to find Node.js in `C:\Program Files\nodejs\`, but it may be installed elsewhere (e.g., `D:\Program Files\nodejs\`).

1. **Check your Node.js installation path:**
   ```powershell
   where.exe node
   ```

2. **If Node.js is not in `C:\Program Files\nodejs\`, create a symbolic link:**
   - Open PowerShell as Administrator
   - Create a symbolic link to redirect goose to your actual Node.js installation:
   ```powershell
   mklink /D "C:\Program Files\nodejs" "D:\Program Files\nodejs"
   ```
   (Replace `D:\Program Files\nodejs` with your actual Node.js installation path)

3. **Restart goose** and try activating the extension again.

This creates a symbolic link that allows goose to find Node.js in the expected location while keeping your actual installation intact.

---

### Malicious Package Detected 

If you see an error about a "blocked malicious package" when trying to use an extension, it means the extension was blocked because malware was detected in a package used by the extension. The error message will contain details about the package, for example:

```
Blocked malicious package: package-name@1.0.0 (npm). OSV MAL advisories: MAL-2024-1234
```

Steps to resolve:
1. **Find an alternative**: Look for similar extensions in the [extensions directory][extensions-directory] or [PulseMCP](https://www.pulsemcp.com/servers)
2. **Optional verification**: Verify the source of the blocked extension or the package name/publisher
3. **Report false positives**: If you believe this is an error, please [open an issue](https://github.com/block/goose/issues)

This security check only applies to locally-executed external extensions that use PyPI (`uvx`) or NPM (`npx`). The check uses real-time data from the OSV database; if the security service is unavailable, extensions will still install normally.

As a best practice, only install extensions from trusted, official sources.

---

### macOS Permission Issues

If you encounter an issue where the goose Desktop app shows no window on launch, it may be due to file and folder permissions. This typically happens because goose needs read and write access to the `~/.config` directory to create its log directory and file. 
Similarly, if tools fail to create files or directories during use, it could be caused by the same permission issue.

#### How to Check and Fix Permissions:

1. Open Terminal.
2. Run the following command to check the current permissions for ~/.config:
  ```sh
  ls -ld ~/.config
  ```
**Example output:**
  ```sh
  drwx------  7 yourusername  staff  224 Jan 15 12:00 /Users/yourusername/.config
  ```
`rwx` indicates you have read (r), write (w), and execute (x) permissions for your user. If you do not see `rwx` for your user, follow the steps below.

#### How to Grant Read and Write Permissions:

1. To add the correct permissions, run the following commands:
    ```sh
    chmod u+rw ~/.config
    ```
    If the ~/.config directory does not exist, create it and then assign permissions:
      ```sh
      mkdir -p ~/.config
      chmod u+rw ~/.config
      ```
2. Verify the change:
    ```sh
    ls -ld ~/.config
    ```

If you still experience issues after fixing permissions, try launching goose with superuser (admin) privileges:
```sh
sudo /Applications/Goose.app/Contents/MacOS/Goose
```

:::note
Running goose with sudo may create files owned by root, which could lead to further permission issues. Use this as a troubleshooting step rather than a permanent fix.
:::

#### Update permission in System Settings (macOs)
1. Go to `System Settings` -> `Privacy & Security` -> `Files & Folders`
2. Grant goose access

---

### Connection Error with Ollama Provider on WSL

If you encounter an error like this when setting up Ollama as the provider in goose:
    ```
    Execution error: error sending request for url (http://localhost:11434/v1/chat/completions)
    ```
This likely means that the local host address is not accessible from WSL.
1. Check if the service is running:
    ```
    curl http://localhost:11434/api/tags
    ```
    If you receive a `failed to connect` error, it’s possible that WSL is using a different IP for localhost. In that case, run the following command to find the correct IP address for WSL:
    ```
    ip route show | grep -i default | awk '{ print $3 }'
    ```
2. Once you get the IP address, use it in your goose configuration instead of localhost. For example:
    ```
    http://172.24.80.1:11434
    ```
    
If you still encounter a `failed to connect` error, you can try using WSL's [Mirrored Networking](https://learn.microsoft.com/en-us/windows/wsl/networking#mirrored-mode-networking) setting if you using Windows 11 22H2 or higher 

---

### Airgapped/Offline Environment Issues

If you're working in an airgapped, offline, or corporate-restricted environment, you may encounter issues where MCP server extensions fail to activate or download their runtime dependencies.

#### Symptoms:
- Extensions fail to activate with error messages about missing runtime environments
- Errors containing "hermit:fatal" or failed internet downloads
- Extensions work on personal machines but fail in corporate/restricted networks
- Error messages like: `Failed to start extension: Could not run extension command`

#### Solution:
goose Desktop uses **"shims"** (packaged versions of `npx` and `uvx`) that automatically download runtime environments via Hermit. In restricted networks, these downloads fail.

**Workaround - Use Custom Command Names:**

1. **Create alternatively named versions of package runners on your system:**
   ```bash
   # For uvx (Python packages)
   ln -s /usr/local/bin/uvx /usr/local/bin/runuv
   
   # For npx (Node.js packages)  
   ln -s /usr/local/bin/npx /usr/local/bin/runnpx
   ```

2. **Update your MCP server configurations to use the custom names:**
   
   Instead of:
   ```yaml
   extensions:
     example:
       cmd: uvx
       args: [mcp-server-example]
   ```
   
   Use:
   ```yaml
   extensions:
     example:
       cmd: runuv  # This bypasses goose's shims
       args: [mcp-server-example]
   ```

3. **Why this works:** goose only replaces known command names (`npx`, `uvx`, `jbang`, etc.) with its packaged shims. Custom names are passed through unchanged to your system's actual executables.

4. **Require more changes**: In a corporate proxy environment or airgapped environment where the above doesn't work, it is recommended that you customize and package up goose desktop with shims/config that will work given the network constraints you have (for example, TLS certificate limitations, proxies, inability to download required content etc).

---
### Need Further Help? 
If you have questions, run into issues, or just need to brainstorm ideas join the [Discord Community][discord]!



[handling-rate-limits]: /docs/guides/handling-llm-rate-limits-with-goose
[installation]: /docs/getting-started/installation
[discord]: https://discord.gg/goose-oss
[goosehints]: /docs/guides/using-goosehints
[configure-llm-provider]: /docs/getting-started/providers
[extensions-directory]: /extensions