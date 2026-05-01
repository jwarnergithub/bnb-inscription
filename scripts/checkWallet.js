const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();

  if (!signer) {
    throw new Error("No signer found. Add PRIVATE_KEY to .env first.");
  }

  const balance = await hre.ethers.provider.getBalance(signer.address);
  const network = await hre.ethers.provider.getNetwork();
  const symbol = network.chainId === 97n ? "tBNB" : "BNB";

  console.log("Address:", signer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), symbol);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
