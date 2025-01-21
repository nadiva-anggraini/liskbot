const { ethers } = require("ethers");
const fs = require("fs");
const WETH_CONTRACT_ADDRESS = "0x4200000000000000000000000000000000000006"; // Ethereum Mainnet
const WETH_ABI = [
  "function deposit() payable",
  "function balanceOf(address owner) view returns (uint256)"
];

async function wrapETH(amount, privateKey, providerUrl) {
  const provider = new ethers.JsonRpcProvider(providerUrl);
  const walletInstance = new ethers.Wallet(privateKey, provider);
  const wethContract = new ethers.Contract(WETH_CONTRACT_ADDRESS, WETH_ABI, walletInstance);
  console.log(`\nUsing wallet: ${walletInstance.address}`);
  try {
    const tx = await wethContract.deposit({ value: ethers.parseEther(amount) });
    console.log(`Wrap transaction sent: https://blockscout.lisk.com/tx/${tx.hash}`);
    await tx.wait();
    console.log(`ETH successfully wrapped to WETH.`);
    const balance = await wethContract.balanceOf(walletInstance.address);
    console.log(`New WETH Balance: ${ethers.formatEther(balance)} WETH`);
  } catch (error) {
    console.error(`Error processing wallet ${walletInstance.address}:`, error.message);
  }
}
function loadPrivateKeys(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File ${filePath} not found.`);
    process.exit(1);
  }
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}
(async () => {
  const filePath = "./privateKeys.json";
  const privateKeys = loadPrivateKeys(filePath);

  const providerUrl = "https://rpc.api.lisk.com";
  const amount = "0.001";
  for (const privateKey of privateKeys) {
    await wrapETH(amount, privateKey, providerUrl);
  }
})();

