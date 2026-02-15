# Tuams

A decentralized email and messaging application built on the [Internet Computer](https://internetcomputer.org/) (ICP) blockchain. Tuams provides privacy-first communication through on-chain storage and Internet Identity authentication — no centralized servers, no data harvesting.

## Features

### Email
- Send and receive emails between ICP principals
- Inbox with unread tracking, sent mail folder, and starred emails
- Compose dialog with subject and body fields
- Mark as read and star/unstar functionality

### Chat
- Real-time messaging between principals
- Chat list with last message preview and unread counts
- New chat initialization with any principal ID

### Reminders
- Set reminders on emails with quick presets (30 min, 1 hour, 3 hours, tomorrow 9 AM)
- Toast notifications when reminders are due
- Cancel and dismiss reminders

### Authentication
- Internet Identity integration for passwordless, Web3 authentication
- Principal-based user identification
- Automatic user creation on first login

## Tech Stack

**Backend**
- Rust smart contract (canister) on ICP
- `ic-cdk` 0.18 / `candid` 0.10 / `ic-cdk-timers` 0.12
- Stable storage for upgrade persistence

**Frontend**
- React 19 + Next.js 16 (static export)
- TypeScript + Tailwind CSS
- Radix UI component library
- React Hook Form + Zod validation

**Blockchain**
- `@dfinity/agent`, `@dfinity/auth-client`, `@dfinity/principal`
- Internet Identity for authentication
- DFX 0.30+ for local development and deployment

## Prerequisites

> **Important:** The DFX SDK (used to build and deploy ICP canisters) only runs on **Linux** or **macOS**. If you are on Windows, you **must** use WSL (Windows Subsystem for Linux) to run this project.

### Step 1: Set up a Linux environment

**If you are on Ubuntu / macOS**, you can skip this step.

**If you are on Windows**, install WSL first:

1. Open **PowerShell as Administrator** and run:
   ```powershell
   wsl --install
   ```
2. Restart your computer when prompted.
3. After restart, Ubuntu will open automatically. Create a username and password when asked.
4. From now on, **run all commands inside the Ubuntu terminal** (you can open it by searching "Ubuntu" in the Start menu).

### Step 2: Install Node.js

Node.js is the JavaScript runtime needed to install frontend dependencies and run build scripts.

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Reload your terminal config
source ~/.bashrc

# Install and use Node.js 20 (LTS)
nvm install 20
nvm use 20

# Verify installation
node --version   # Should print v20.x.x
npm --version    # Should print 10.x.x
```

### Step 3: Install pnpm

pnpm is a fast package manager used for the frontend dependencies.

```bash
npm install -g pnpm

# Verify installation
pnpm --version
```

### Step 4: Install Rust

Rust is used to write the backend smart contract (canister).

```bash
# Install Rust using rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# When prompted, press 1 to proceed with the default installation

# Reload your terminal config
source ~/.bashrc

# Add the WebAssembly target (required for ICP canisters)
rustup target add wasm32-unknown-unknown

# Verify installation
rustc --version   # Should print rustc 1.x.x
cargo --version   # Should print cargo 1.x.x
```

### Step 5: Install DFX (DFINITY SDK)

DFX is the command-line tool for building, deploying, and managing canisters on the Internet Computer.

```bash
# Install DFX
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Reload your terminal config
source ~/.bashrc

# Verify installation
dfx --version   # Should print dfx 0.30.x or higher
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/Tuams.git
cd Tuams
```

### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd src/my_motoko_project_frontend/assets
pnpm install
cd ../../..
```

### 3. Build the frontend

```bash
cd src/my_motoko_project_frontend/assets
pnpm run build
cd ../../..
```

This generates the static frontend files in the `out/` directory that will be deployed as an asset canister.

### 4. Start the local ICP replica

The replica is a local simulation of the Internet Computer blockchain running on your machine.

```bash
dfx start --background
```

You should see output indicating the replica is running. The `--background` flag runs it in the background so you can continue using the terminal.

### 5. Deploy canisters

```bash
dfx deploy
```

This will:
- Compile the Rust backend canister to WebAssembly
- Download and deploy the Internet Identity canister locally (used for login)
- Deploy the frontend assets canister
- Print the canister IDs and URLs when done

> **Note:** The first time you run `dfx deploy`, it may take a few minutes to compile the Rust code and download the Internet Identity canister.

### 6. Access the application

After deployment completes, DFX will print URLs like:

```
Frontend canister via browser:
    my_motoko_project_frontend: http://127.0.0.1:4943/?canisterId=<canister-id>
```

Open that URL in your browser to use Tuams. You can log in using Internet Identity (a new identity will be created for you on the local replica).

### 7. Stop the replica (when you're done)

```bash
dfx stop
```

## Project Structure

```
Tuams/
├── dfx.json                          # DFX canister configuration
├── Cargo.toml                        # Rust workspace config
├── package.json                      # Root npm config
├── src/
│   ├── my_motoko_project_backend/    # Rust backend canister
│   │   ├── src/lib.rs                # Main canister logic (email, chat, reminders)
│   │   ├── Cargo.toml                # Rust dependencies
│   │   └── *.did                     # Candid interface definition
│   └── my_motoko_project_frontend/
│       └── assets/                   # Next.js frontend app
│           ├── app/                  # Next.js pages & layouts
│           │   └── tuamail/          # Main email/chat application page
│           ├── components/           # React UI components
│           ├── lib/                  # Utilities, hooks & Internet Identity integration
│           ├── package.json          # Frontend dependencies
│           └── tailwind.config.ts    # Tailwind CSS configuration
```

## Architecture

All data is stored **on-chain** in the backend canister using thread-local `HashMap` storage with `RefCell`. Data persists across canister upgrades via pre/post-upgrade hooks with stable storage serialization.

The frontend is a statically exported Next.js app served as an ICP asset canister. It communicates with the backend canister through the `@dfinity/agent` library and authenticates users via Internet Identity.

## Troubleshooting

**`dfx: command not found`**
Run `source ~/.bashrc` or restart your terminal. Make sure you installed DFX (see Step 5 above).

**`rustc: command not found`**
Run `source ~/.bashrc` or restart your terminal. Make sure you installed Rust (see Step 4 above).

**`error: target wasm32-unknown-unknown not found`**
Run `rustup target add wasm32-unknown-unknown` to add the WebAssembly compilation target.

**Replica fails to start**
Make sure no other `dfx` process is running. Try `dfx stop` first, then `dfx start --background` again.

**Frontend not loading after deploy**
Make sure you built the frontend before deploying (`pnpm run build` in the assets directory). Then redeploy with `dfx deploy`.

## License

This project is open source. See the [LICENSE](LICENSE) file for details.
