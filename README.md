# On-Chain Red Riding Hood

This is a Hardhat project for deploying an ERC-721-compatible NFT collection on BNB Smart Chain where the NFT metadata and JPG image data are stored entirely on-chain.

The contract does not use IPFS, Arweave, BNB Greenfield, a web server, or an external metadata gateway. Each token's `tokenURI` returns a `data:application/json;base64,...` URI. The JSON metadata contains an `image` field that is also a data URI: `data:image/jpeg;base64,...`.

## What This Does

- Deploys an ERC-721 NFT contract named `On-Chain Red Riding Hood` with symbol `REDHOOD`.
- Mints an NFT to the deployer wallet.
- Reads a local JPG file, converts it to base64, and splits it into chunks.
- Uploads those chunks into contract storage over multiple transactions.
- Freezes the token after upload so that token's image and metadata cannot be changed.
- Verifies that the on-chain image bytes match the local JPG exactly.
- Supports adding more tokens/images to the same collection later.

## Important Notes

Fully on-chain JPG storage is more expensive than a normal NFT because the image bytes are stored in EVM contract storage. Small, compressed JPGs are strongly recommended.

The included deployment scripts sign transactions with a private key from `.env`. Never commit `.env` or paste private keys into chat, issues, pull requests, or README files.

## Project Files

- `contracts/OnChainRedRidingHood.sol` - ERC-721 contract with per-token on-chain JPG chunks and frozen metadata.
- `scripts/deployAndMint.js` - deploys a new collection, mints one token, uploads the image, and freezes it.
- `scripts/mintToken.js` - mints another token/image into an existing deployed collection.
- `scripts/verifyTokenURI.js` - decodes `tokenURI`, extracts the image, and compares it to the local JPG.
- `scripts/checkWallet.js` - prints the deployer address and BNB/tBNB balance.
- `.env.example` - safe configuration template.

## Setup

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env` and fill in your own private key:

```text
BSC_TESTNET_RPC=https://bsc-testnet-rpc.publicnode.com
BSC_MAINNET_RPC=https://bsc-rpc.publicnode.com
PRIVATE_KEY=your_private_key
CONTRACT_ADDRESS=
TOKEN_ID=1
IMAGE_FILE=your-image.jpg
TOKEN_NAME=Red Riding Hood
TOKEN_DESCRIPTION=A JPG image and NFT metadata stored entirely on BNB Smart Chain.
```

Compile:

```bash
npm run compile
```

## Deploy To BNB Testnet

Check the deployer balance:

```bash
npm run check:testnet
```

Deploy and mint token `1`:

```bash
npm run deploy:testnet
```

After deployment, paste the printed contract address into `.env`:

```text
CONTRACT_ADDRESS=0xYourContractAddress
```

Verify the on-chain metadata and image:

```bash
npm run verify:token
```

## Deploy To BNB Mainnet

Before running this, fund the deployer wallet with real BNB on BNB Smart Chain mainnet.

Check the deployer balance:

```bash
npm run check:mainnet
```

Deploy and mint token `1` on mainnet:

```bash
npm run deploy:mainnet
```

After deployment, paste the printed contract address into `.env`:

```text
CONTRACT_ADDRESS=0xYourContractAddress
```

Verify the mainnet token:

```bash
npm run verify:mainnet
```

## Add Another Image To The Same Collection

Put the new JPG in the project folder, then update `.env`:

```text
CONTRACT_ADDRESS=0xYourExistingContract
TOKEN_ID=2
IMAGE_FILE=your-next-image.jpg
TOKEN_NAME=Red Riding Hood #2
TOKEN_DESCRIPTION=Your permanent description.
```

Mint it on testnet:

```bash
npm run mint:testnet
```

Mint it on mainnet:

```bash
npm run mint:mainnet
```

Each token is frozen independently after upload. Freezing token `1` does not prevent minting token `2`.

## Security

`.env` is ignored by git and must stay private. The safe file to commit is `.env.example`.

Before pushing to GitHub, check the files that will be uploaded:

```bash
git status --short
```

The `.env` file should not appear in the list of tracked files.
