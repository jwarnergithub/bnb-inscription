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

function optionalEnv(name, fallback) {
  return process.env[name] || fallback;
}

async function uploadImage(nft, tokenId, chunks) {
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    const tx = await nft.appendImageChunks(tokenId, batch, {
      gasLimit: 9_000_000
    });
    await tx.wait();

    console.log(`Uploaded chunks ${i + 1}-${Math.min(i + BATCH_SIZE, chunks.length)} of ${chunks.length}`);
  }
}

async function main() {
  requireEnv("PRIVATE_KEY");

  const tokenId = Number(optionalEnv("TOKEN_ID", "1"));
  const imageFile = optionalEnv("IMAGE_FILE", "your-image.jpg");
  const tokenName = optionalEnv("TOKEN_NAME", "On-Chain Image #1");
  const tokenDescription = optionalEnv(
    "TOKEN_DESCRIPTION",
    "A JPG image and NFT metadata stored entirely on BNB Smart Chain / BSC."
  );
  const imagePath = path.join(__dirname, "..", imageFile);

  if (!Number.isSafeInteger(tokenId) || tokenId < 1) {
    throw new Error("TOKEN_ID must be a positive integer");
  }

  const [deployer] = await hre.ethers.getSigners();
  const imageBase64 = fs.readFileSync(imagePath).toString("base64");
  const chunks = imageBase64.match(new RegExp(`.{1,${CHUNK_SIZE}}`, "g")) || [];
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const network = await hre.ethers.provider.getNetwork();
  const symbol = network.chainId === 97n ? "tBNB" : "BNB";
  const explorer = network.chainId === 97n ? "https://testnet.bscscan.com" : "https://bscscan.com";

  console.log("Deploying from:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), symbol);
  console.log("Token ID:", tokenId);
  console.log("Image file:", imageFile);
  console.log("Image base64 length:", imageBase64.length);
  console.log("Chunk count:", chunks.length);

  const Factory = await hre.ethers.getContractFactory("OnChainImageNFT");
  const nft = await Factory.deploy(deployer.address);
  await nft.waitForDeployment();

  const contractAddress = await nft.getAddress();
  console.log("Contract deployed:", contractAddress);
  console.log(`BscScan: ${explorer}/address/${contractAddress}`);

  let tx = await nft.mint(
    deployer.address,
    tokenId,
    tokenName,
    tokenDescription
  );
  await tx.wait();
  console.log(`Minted token #${tokenId}`);

  await uploadImage(nft, tokenId, chunks);

  tx = await nft.freeze(tokenId);
  await tx.wait();

  console.log(`Token #${tokenId} frozen.`);
  console.log("Add this to .env:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
