const { ethers } = require("ethers");
const axios = require("axios");
const kleur = require("kleur");
const chains = require('./chains');
const fs = require('fs');
const provider = chains.mainnet.lisk.provider;
const delay = chains.utils.etc.delay;
const loading = chains.utils.etc.loadingAnimation;
const header = chains.utils.etc.header;
const PRIVATE_KEYS = JSON.parse(fs.readFileSync('privateKeys.json', 'utf-8'));
const { CronJob } = require('cron');

async function performCheckin(wallet) {
  try {
    const response = await axios.post("https://portal-api.lisk.com/graphql", {
      query: `
        mutation UpdateAirdropTaskStatus($input: UpdateTaskStatusInputData!) {
          userdrop {
            updateTaskStatus(input: $input) {
              success
              progress {
                isCompleted
                completedAt
              }
            }
          }
        }
      `,
      variables: {
        input: {
          address: wallet.address,
          taskID: 1,
        },
      },
    });

    console.log(kleur.green(`Check-in successful for ${wallet.address}`));
    return response.data;
  } catch (error) {
    console.error(
      kleur.yellow(`Check-in failed for ${wallet.address}: `),
      error.message
    );
    throw error;
  }
}

async function fetchUserData(wallet) {
  try {
    const response = await axios.post("https://portal-api.lisk.com/graphql", {
      query: `
        query AirdropUser($filter: UserFilter!, $pointsHistoryFilter: QueryFilter, $tasksFilter: QueryFilter) {
          userdrop {
            user(filter: $filter) {
              address
              referredBy
              verifiedStatus
              rank
              points
              updatedAt
              createdAt
              referrals {
                totalCount
                points
                code
                rank
                referralsInfo {
                  userAddress
                  createdAt
                  points
                }
              }
              pointsHistories(filter: $pointsHistoryFilter) {
                totalCount
                histories {
                  id
                  taskID
                  taskDescription
                  points
                  createdAt
                }
              }
              tasks(filter: $tasksFilter) {
                id
                title
                description
                tasks {
                  id
                  description
                  type
                  daysForStreak
                  createdAt
                  frequency
                  points
                  progress {
                    id
                    isCompleted
                    streakInDays
                    frequencyCounter
                    points
                    completedAt
                  }
                  taskMetadata {
                    link {
                      url
                      description
                    }
                    icon
                  }
                }
                type
              }
            }
          }
        }
      `,
      variables: {
        filter: {
          address: wallet.address,
        },
      },
    });
    const userData = response.data?.data?.userdrop?.user;

    if (userData) {
      console.log(kleur.green(`Fetched User Data for ${wallet.address}`));
      console.log(kleur.blue(`Verified Status: ${userData.verifiedStatus}`));

      switch (userData.verifiedStatus) {
        case "IS_FULLY_VERIFIED":
          console.log(kleur.green("User is fully verified. Continuing process..."));
		  await loading(`Checkin Task...`, 2000);
		  await performCheckin(wallet);
		  await loading(`Swap Task...`, 2000);
		  await executeTrade(key, apiEndpoint, payload);
          console.log('All Done');
          break;

        case "IS_GUILD_VERIFIED":
          console.error(kleur.red(`User is not register yet for ${wallet.address}. Please run register.js`));
          return;
          break;

        case "NOT_VERIFIED":
          console.error(kleur.red(`User is not verified for ${wallet.address}. Please verify first at https://guild.xyz/lisk`));
          return;
          break;

        default:
          console.error(kleur.red(`Unknown verified status: ${userData.verifiedStatus} for ${wallet.address}`));
          return;
      }
    } else {
      console.error(kleur.yellow(`No user data found for ${wallet.address}`));
      return;
    }
  } catch (error) {
    console.error(kleur.red(`Error fetching user data for ${wallet.address}:`), error.message);
    return;
  }
}

async function executeTrade(key, apiEndpoint, payload) {
    const account = await wallet.getAddress();
    payload.account = account;

    console.log(`Wallet Address: ${account}`);
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
        console.error(`Error executing trade for transaction`, error);
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

async function dailyCheckin() {
  header();
  for (const key of PRIVATE_KEYS) {
    const wallet = new ethers.Wallet(key, provider);
    try {
	  await loading(`Fetching User Data`, 2000);
      const fetchData = await fetchUserData(wallet);
	  console.log('')
    } catch (error) {
      console.error(kleur.red(`Error processing wallet ${wallet.address}: ${error.message}`));
    }
  }
}
dailyCheckin()
