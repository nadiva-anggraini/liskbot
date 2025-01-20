const { ethers } = require("ethers");
const fs = require("fs");

// Alamat dan ABI kontrak WETH
const WETH_CONTRACT_ADDRESS = "0x4200000000000000000000000000000000000006"; // Ethereum Mainnet
const WETH_ABI = [
  "function deposit() payable",
  "function balanceOf(address owner) view returns (uint256)"
];

// Fungsi utama untuk wrap ETH menjadi WETH
async function wrapETH(amount, privateKey, providerUrl) {
  const provider = new ethers.JsonRpcProvider(providerUrl);
  const walletInstance = new ethers.Wallet(privateKey, provider);
  const wethContract = new ethers.Contract(WETH_CONTRACT_ADDRESS, WETH_ABI, walletInstance);

  console.log(`\nUsing wallet: ${walletInstance.address}`);

  try {
    // Wrap ETH menjadi WETH
    const tx = await wethContract.deposit({ value: ethers.parseEther(amount) });
    console.log(`Wrap transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log(`ETH successfully wrapped to WETH.`);

    // Menampilkan saldo WETH setelah transaksi
    const balance = await wethContract.balanceOf(walletInstance.address);
    console.log(`New WETH Balance: ${ethers.formatEther(balance)} WETH`);
  } catch (error) {
    console.error(`Error processing wallet ${walletInstance.address}:`, error.message);
  }
}

// Membaca privateKeys.json
function loadPrivateKeys(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File ${filePath} not found.`);
    process.exit(1);
  }
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

// Contoh penggunaan
(async () => {
  const filePath = "./privateKeys.json"; // Path ke file privateKeys.json
  const privateKeys = loadPrivateKeys(filePath);

  const providerUrl = "https://rpc.api.lisk.com";
  const amount = "0.001";

  // Loop melalui semua private keys di privateKeys.json
  for (const privateKey of privateKeys) {
    console.log(`\nProcessing wallet with private key: ${privateKey}`);
    await wrapETH(amount, privateKey, providerUrl);
  }
})();

