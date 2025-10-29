# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

goose is a local, extensible, open-source AI agent that automates engineering tasks. It consists of:
- **Rust backend**: Core agent logic, CLI, and HTTP server
- **Electron frontend**: Desktop application in TypeScript/React
- **Temporal service**: Go-based workflow scheduler
- **MCP support**: Model Context Protocol extensions

## Common Commands

### Build
```bash
# Activate hermit environment (provides cargo, node, just, etc.)
source bin/activate-hermit

# Build Rust (debug)
cargo build

# Build Rust (release)
cargo build --release

# Build release + copy binaries + generate OpenAPI
just release-binary
```

### Test
```bash
# Run all Rust tests
cargo test

# Run tests for specific crate
cargo test -p goose

# Run specific test file
cargo test --package goose --test mcp_integration_test

# Run UI tests
cd ui/desktop && npm test
cd ui/desktop && npm run test-e2e
```

### Lint & Format
```bash
# Format Rust code (ALWAYS run before committing)
cargo fmt

# Run clippy linter (MUST pass before merging)
./scripts/clippy-lint.sh

# Check UI code
cd ui/desktop && npm run lint:check
cd ui/desktop && npm run typecheck
```

### Run Application
```bash
# Run CLI in debug mode
cargo run -p goose-cli

# Run desktop app (builds release binaries + starts UI)
just run-ui

# Run desktop with external backend (for debugging server)
just debug-ui

# Run server only
just run-server
# or: cargo run -p goose-server --bin goosed agent

# Run docs site
just run-docs
```

### OpenAPI Generation
```bash
# After modifying goose-server routes, regenerate OpenAPI spec and TypeScript client
just generate-openapi

# Check if OpenAPI is up-to-date
just check-openapi-schema
```

## Architecture

### Crate Structure

```
crates/
├── goose              # Core agent logic, providers, execution engine
├── goose-cli          # Command-line interface entry point
├── goose-server       # HTTP server (binary: goosed) for desktop app
├── goose-mcp          # MCP server implementations (e.g., developer)
├── goose-bench        # Benchmarking tools
└── goose-test         # Test utilities
```

### Key Directories

- **`crates/goose/src/agents/`**: Agent implementations and execution logic
- **`crates/goose/src/providers/`**: LLM provider integrations
- **`crates/goose/src/execution/`**: Tool and command execution
- **`crates/goose/src/recipe/`**: Recipe parsing and execution
- **`crates/goose-server/src/routes/`**: HTTP API endpoints
- **`ui/desktop/src/`**: Electron app (main.ts, renderer.tsx, components)
- **`temporal-service/`**: Go-based workflow scheduler

### Data Flow

1. **CLI**: `goose-cli` → `goose` crate → LLM providers → tool execution
2. **Desktop**: Electron UI → HTTP requests → `goose-server` → `goose` crate
3. **OpenAPI sync**: Rust server definitions → `openapi.json` → TypeScript client (`ui/desktop/src/api/`)

## Adding Features

### Backend Feature (Rust)

1. Implement logic in `crates/goose/src/`
2. If CLI-accessible, add interface in `crates/goose-cli/src/`
3. If Desktop-accessible:
   - Add routes in `crates/goose-server/src/routes/`
   - Run `just generate-openapi` to update TypeScript client
   - Call from UI using generated API client

### Frontend Feature (Desktop)

1. Create component in `ui/desktop/src/components/`
2. If backend needed, add server route first (see above)
3. Use generated API client from `ui/desktop/src/api/`
4. Test with `just run-ui`

### MCP Extension

- Add to `crates/goose-mcp/`
- Follow existing patterns (e.g., `developer` subsystem)

### Recipe

- Add YAML file to `documentation/src/pages/recipes/data/recipes/`
- See `CONTRIBUTING_RECIPES.md` for format
- Test with `goose run --recipe your-recipe.yaml`

## Development Workflow

1. Activate hermit: `source bin/activate-hermit`
2. Make changes
3. Format: `cargo fmt`
4. Build: `cargo build`
5. Test: `cargo test -p <crate>` and/or `cd ui/desktop && npm test`
6. Lint: `./scripts/clippy-lint.sh`
7. If server changes: `just generate-openapi`
8. Commit with `--signoff` flag

## Testing Patterns

- **Integration tests**: Place in `crates/goose/tests/` rather than inline
- **UI tests**: Use `npm run test-e2e` with Playwright
- **MCP tests**: `just record-mcp-tests` to record/replay interactions
- **Self-test**: Update `goose-self-test.yaml` when adding features, then run `goose run --recipe goose-self-test.yaml`

## Important Rules

- **ALWAYS** run `cargo fmt` before committing
- **MUST** pass `./scripts/clippy-lint.sh` before merging
- **NEVER** edit `ui/desktop/openapi.json` manually (generated file)
- **NEVER** edit `Cargo.toml` directly; use `cargo add <crate>` instead
- **Use** `anyhow::Result` for error handling
- After unstaged changes review, check if changes compile, format, and pass clippy
- When adding dependencies, ensure they don't conflict with workspace versions

## Testing Individual Components

```bash
# Run single test
cargo test --package goose --test <test_name> -- <test_function>

# Run UI test by name
cd ui/desktop && npm run test-e2e:single -- -g "test name"

# Debug UI test
cd ui/desktop && npm run test-e2e:debug
```

## Entry Points

- **CLI**: `crates/goose-cli/src/main.rs`
- **Server**: `crates/goose-server/src/main.rs` (binary: `goosed`)
- **Desktop UI**: `ui/desktop/src/main.ts` (Electron main process)
- **Desktop Renderer**: `ui/desktop/src/renderer.tsx` (React app)
- **Core Agent**: `crates/goose/src/agents/agent.rs`

## Provider Implementation

To add a new LLM provider:
1. Implement `Provider` trait in `crates/goose/src/providers/`
2. See `providers/base.rs` for trait definition
3. Add configuration in `crates/goose/src/config/`

## Environment Variables

- `GOOSE_PROVIDER`: Override configured provider
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc.: Provider credentials
- `GOOSE_SERVER__SECRET_KEY`: Server authentication (dev: use `test`)
- `GOOSE_PORT`: Server port (default: 3000)
- `LANGFUSE_INIT_PROJECT_PUBLIC_KEY`, `LANGFUSE_INIT_PROJECT_SECRET_KEY`: Tracing

## Release Process

```bash
# Create release branch and bump version
just prepare-release X.Y.Z

# After merging to main, tag and push
just tag-push

# Generate release notes
just release-notes vX.Y.Z-old
```

## Cross-Platform Notes

- **Windows**: Use PowerShell-compatible `just` commands (e.g., `just win-total-dbg`)
- **Linux**: May need `build-essential` and `libxcb1-dev`
- **macOS Intel**: `just release-intel` for x86_64 builds

## Temporal Scheduler (Optional)

```bash
# Start Temporal services
just start-temporal

# Stop Temporal services
just stop-temporal

# Check status
just status-temporal
```

## Useful Checks

- Check unstaged changes to see current work: `git diff`
- Verify OpenAPI sync: `just check-openapi-schema`
- View server logs: Check `goose-server` output when running `just run-ui`
