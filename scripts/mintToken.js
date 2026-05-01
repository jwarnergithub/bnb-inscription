const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const CHUNK_SIZE = 4000;
const BATCH_SIZE = 2;

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} in .env`);
  }

  return value;
}

async function main() {
  requireEnv("PRIVATE_KEY");

  const contractAddress = requireEnv("CONTRACT_ADDRESS");
  const tokenId = Number(requireEnv("TOKEN_ID"));
  const imageFile = requireEnv("IMAGE_FILE");
  const tokenName = requireEnv("TOKEN_NAME");
  const tokenDescription = requireEnv("TOKEN_DESCRIPTION");
  const imagePath = path.join(__dirname, "..", imageFile);

  if (!Number.isSafeInteger(tokenId) || tokenId < 1) {
    throw new Error("TOKEN_ID must be a positive integer");
  }

  const [deployer] = await hre.ethers.getSigners();
  const nft = await hre.ethers.getContractAt("OnChainRedRidingHood", contractAddress);
  const owner = await nft.owner();

  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(`Wallet ${deployer.address} is not the contract owner ${owner}`);
  }

  const imageBase64 = fs.readFileSync(imagePath).toString("base64");
  const chunks = imageBase64.match(new RegExp(`.{1,${CHUNK_SIZE}}`, "g")) || [];
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const network = await hre.ethers.provider.getNetwork();
  const symbol = network.chainId === 97n ? "tBNB" : "BNB";

  console.log("Contract:", contractAddress);
  console.log("Minting from:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), symbol);
  console.log("Token ID:", tokenId);
  console.log("Image file:", imageFile);
  console.log("Image base64 length:", imageBase64.length);
  console.log("Chunk count:", chunks.length);

  let tx = await nft.mint(deployer.address, tokenId, tokenName, tokenDescription);
  await tx.wait();
  console.log(`Minted token #${tokenId}`);

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    tx = await nft.appendImageChunks(tokenId, batch, {
      gasLimit: 9_000_000
    });
    await tx.wait();

    console.log(`Uploaded chunks ${i + 1}-${Math.min(i + BATCH_SIZE, chunks.length)} of ${chunks.length}`);
  }

  tx = await nft.freeze(tokenId);
  await tx.wait();

  console.log(`Token #${tokenId} frozen.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
