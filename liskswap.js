const { ethers } = require("ethers");
const axios = require("axios");
const kleur = require("kleur");
const chains = require('./chains');
const fs = require('fs');
const { CronJob } = require('cron');

const provider = chains.mainnet.lisk.provider();
const explorer = chains.mainnet.lisk.explorer;
const delay = chains.utils.etc.delay;
const header = chains.utils.etc.header;
const PRIVATE_KEYS = JSON.parse(fs.readFileSync('privateKeys.json', 'utf-8'));

async function executeTrade(privateKey, apiEndpoint, payload, transactionNumber) {
    const wallet = new ethers.Wallet(privateKey, provider);
    const account = await wallet.getAddress();
    payload.account = account;

    console.log(`Wallet Address: ${account} | Transaction: ${transactionNumber}`);
    try {
        const response = await axios.post(apiEndpoint, payload);
        const { trade } = response.data.coupon.raw.executionInformation;
        const gasFee = response.data.fees.gas;
        const value = trade.value === '0x00' ? 0 : ethers.parseUnits(trade.value, 18);

        const tx = {
            to: trade.to,
            data: trade.data,
            value: value,
            gasLimit: gasFee,
        };

        const txResponse = await wallet.sendTransaction(tx);
        const receipt = await txResponse.wait();

        console.log(kleur.blue(`Transaction Confirmed: ${explorer.tx(receipt.hash)}`));
    } catch (error) {
        console.error(`Error executing trade for transaction ${transactionNumber}:`, error);
    }
}

const apiEndpoint = "https://canoe.v2.icarus.tools/market/usor/swap_quote";
const payload = {
    chain: "lisk",
    inTokenAddress: "0x4200000000000000000000000000000000000006",
    outTokenAddress: "0xac485391EB2d7D88253a7F1eF18C37f4242D1A24",
    isExactIn: true,
    slippage: 50,
    inTokenAmount: "0.000001",
};

async function runTrade() {
    header();
    for (const [index, privateKey] of PRIVATE_KEYS.entries()) {
        console.log(kleur.green(`Starting transactions for Wallet ${index + 1}`));
        for (let i = 1; i <= 15; i++) {
            await executeTrade(privateKey, apiEndpoint, payload, i);
            await delay(5000);
        }
        console.log(kleur.green(`Completed 15 transactions for Wallet ${index + 1}`));
		console.log('');
    }
}

runTrade().catch(error => console.error("Error in runTrade:", error));
