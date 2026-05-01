const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const JSON_PREFIX = "data:application/json;base64,";
const IMAGE_PREFIX = "data:image/jpeg;base64,";

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

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function main() {
  const contractAddress = requireEnv("CONTRACT_ADDRESS");
  const tokenId = Number(optionalEnv("TOKEN_ID", "1"));
  const imageFile = optionalEnv("IMAGE_FILE", "your-image.jpg");
  const imagePath = path.join(__dirname, "..", imageFile);
  const nft = await hre.ethers.getContractAt("OnChainRedRidingHood", contractAddress);

  if (!Number.isSafeInteger(tokenId) || tokenId < 1) {
    throw new Error("TOKEN_ID must be a positive integer");
  }

  const tokenURI = await nft.tokenURI(tokenId);

  if (!tokenURI.startsWith(JSON_PREFIX)) {
    throw new Error("tokenURI is not a base64 JSON data URI");
  }

  const json = JSON.parse(Buffer.from(tokenURI.slice(JSON_PREFIX.length), "base64").toString("utf8"));

  if (!json.image || !json.image.startsWith(IMAGE_PREFIX)) {
    throw new Error("metadata image is not a base64 JPG data URI");
  }

  const decodedImage = Buffer.from(json.image.slice(IMAGE_PREFIX.length), "base64");
  const localImage = fs.readFileSync(imagePath);
  const decodedHash = sha256(decodedImage);
  const localHash = sha256(localImage);

  console.log("Name:", json.name);
  console.log("Description:", json.description);
  console.log("Token ID:", tokenId);
  console.log("Image file:", imageFile);
  console.log("Decoded image bytes:", decodedImage.length);
  console.log("Original image bytes:", localImage.length);
  console.log("Decoded image sha256:", decodedHash);
  console.log("Original image sha256:", localHash);

  if (decodedHash !== localHash) {
    throw new Error(`Decoded on-chain image does not match ${imageFile}`);
  }

  console.log("Verified: tokenURI metadata and embedded JPG match the local file.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
