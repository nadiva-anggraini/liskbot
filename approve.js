const moment = require('moment-timezone');
const readlineSync = require('readline-sync');
const { CronJob } = require('cron');
const { ethers } = require("ethers");
const fs = require('fs');
const chains = require('./chains');
const provider = chains.mainnet.lisk.provider();
const explorer = chains.mainnet.lisk.explorer;
const delay = chains.utils.etc.delay;
const header = chains.utils.etc.header;
const { WETH_ABI } = require('./abi/abi');
const WETH_CA = '0x4200000000000000000000000000000000000006';
const PRIVATE_KEYS = JSON.parse(fs.readFileSync('privateKeys.json', 'utf-8'));
const SPENDER_CA = '0xB952578f3520EE8Ea45b7914994dcf4702cEe578';

async function doApprove (privateKey) {
	try {
	 const wallet = new ethers.Wallet(privateKey, provider);
	 const approveToken = new ethers.Contract(WETH_CA, WETH_ABI, wallet);
	 console.log(`[${moment().format('HH:mm:ss')}] Wallet Address: ${wallet.address}`
	 const amount =  '1461501637330902918203684832716283019655932542975';
	 const txApprove = await approveToken.approve(SPENDER_CA, amount);
	 const receiptApprove = await txApprove.wait(1);
	 return receiptApprove;
	} catch (error) {
		console.log(`[${moment().format('HH:mm:ss')}] Error executing transaction: ${error.message}`.red
      );
	}
}
async function runApprove() {
  header();
  console.log('Preparing to Approve Transaction...'.yellow);

  for (const PRIVATE_KEY of PRIVATE_KEYS) {
    try {
	 const receiptApprove = await doApprove(PRIVATE_KEY);
      if (receiptApprove.from) {
		console.log(
          `[${moment().tz("Asia/Jakarta").format('HH:mm:ss [WIB]')}] Approve Hash: ${explorer.tx(receiptApprove.hash)}`.cyan
        );
	  }         
		console.log('');
    } catch (error) {
      console.log(
        `[${moment().tz("Asia/Jakarta").format('HH:mm:ss [WIB]')}] Error processing transaction. Please try again later.`.red
      );
      console.log('');
    }
  }
}
runApprove();
