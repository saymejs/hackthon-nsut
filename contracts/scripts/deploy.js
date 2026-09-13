const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log("   Deploying AgentVault for W3A-1 Hackathon      ");
  console.log("=================================================");

  const [owner, agent] = await hre.ethers.getSigners();
  console.log(`Deployer / Owner Address : ${owner.address}`);
  console.log(`Authorized Agent Address : ${agent.address}`);

  const spendLimit = hre.ethers.parseEther("0.05"); // 0.05 ETH spend ceiling
  const initialFunding = hre.ethers.parseEther("0.1"); // 0.1 ETH vault funding

  console.log(`Configured Spend Limit  : ${hre.ethers.formatEther(spendLimit)} ETH`);
  console.log(`Initial Vault Deposit   : ${hre.ethers.formatEther(initialFunding)} ETH`);

  // Deploy AgentVault contract
  const AgentVault = await hre.ethers.getContractFactory("AgentVault");
  const vault = await AgentVault.deploy(agent.address, spendLimit, {
    value: initialFunding,
  });

  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();

  console.log(`\n>>> AgentVault successfully deployed at: ${vaultAddress}`);

  // Fetch full ABI from Hardhat build artifacts
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/AgentVault.sol/AgentVault.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Structure deployment payload
  const deploymentData = {
    address: vaultAddress,
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    spendLimitWei: spendLimit.toString(),
    spendLimitEth: hre.ethers.formatEther(spendLimit),
    initialBalanceWei: initialFunding.toString(),
    ownerAddress: owner.address,
    agentAddress: agent.address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  // Write out deployed_vault.json in root of contracts/
  const exportPath = path.join(__dirname, "../deployed_vault.json");
  fs.writeFileSync(exportPath, JSON.stringify(deploymentData, null, 2), "utf8");
  console.log(`>>> Deployment metadata exported to: ${exportPath}`);

  // Also write a copy to root workspace for easy pickup by agent & frontend
  const rootExportPath = path.join(__dirname, "../../deployed_vault.json");
  try {
    fs.writeFileSync(rootExportPath, JSON.stringify(deploymentData, null, 2), "utf8");
    console.log(`>>> Workspace copy exported to: ${rootExportPath}`);
  } catch (err) {
    // optional workspace mirror
  }

  console.log("=================================================");
  console.log("   Deployment & Verification Complete!           ");
  console.log("=================================================");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
