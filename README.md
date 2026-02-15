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

- [Node.js](https://nodejs.org/) >= 16.0.0
- [Rust](https://www.rust-lang.org/tools/install) with `wasm32-unknown-unknown` target
- [DFX SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install) >= 0.30
- [pnpm](https://pnpm.io/) (for frontend dependencies)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/Tuams.git
cd Tuams
```

### 2. Install dependencies

```bash
# Root dependencies
npm install

# Frontend dependencies
cd src/my_motoko_project_frontend/assets
pnpm install
cd ../../..
```

### 3. Start the local ICP replica

```bash
dfx start --background
```

### 4. Deploy canisters

```bash
dfx deploy
```

This will:
- Compile the Rust backend canister
- Download and deploy the Internet Identity canister locally
- Deploy the frontend assets canister

### 5. Build the frontend

```bash
cd src/my_motoko_project_frontend/assets
pnpm run build
cd ../../..
```

### 6. Access the application

Once deployed, the app will be available at:

```
http://localhost:4943?canisterId={frontend_canister_id}
```

The canister IDs are printed after `dfx deploy` and saved to the `.env` file.

## Project Structure

```
Tuams/
├── dfx.json                          # DFX canister configuration
├── Cargo.toml                        # Rust workspace config
├── package.json                      # Root npm config
├── src/
│   ├── my_motoko_project_backend/    # Rust backend canister
│   │   ├── src/lib.rs                # Main canister logic
│   │   ├── Cargo.toml                # Rust dependencies
│   │   └── *.did                     # Candid interface
│   └── my_motoko_project_frontend/
│       └── assets/                   # Next.js frontend app
│           ├── app/                  # Next.js pages & layouts
│           ├── components/           # React components
│           ├── lib/                  # Utilities & hooks
│           ├── package.json          # Frontend dependencies
│           └── tailwind.config.ts    # Tailwind configuration
```

## Architecture

All data is stored **on-chain** in the backend canister using thread-local `HashMap` storage with `RefCell`. Data persists across canister upgrades via pre/post-upgrade hooks with stable storage serialization.

The frontend is a statically exported Next.js app served as an ICP asset canister. It communicates with the backend canister through the `@dfinity/agent` library and authenticates users via Internet Identity.

## License

This project is open source. See the [LICENSE](LICENSE) file for details.
