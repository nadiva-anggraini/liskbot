const { ethers } = require("ethers");
const axios = require("axios");
const kleur = require("kleur");
const chains = require('./chains');
const fs = require('fs');
const provider = chains.mainnet.lisk.provider;
const delay = chains.utils.etc.delay;
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

async function fetchAdditionalData(wallet) {
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
      console.log(kleur.blue(`Rank: ${userData.rank} | Points: ${userData.points} | Status Account: ${userData.verifiedStatus} for ${wallet.address}`));
    } else {
      console.log(kleur.yellow(`No user data returned for ${wallet.address}`));
    }
    return response.data;
  } catch (error) {
    console.error(
      kleur.yellow(`Failed to fetch additional data for ${wallet.address}: `),
      error.message
    );
    throw error;
  }
}

async function dailyCheckin() {
  header();
  for (const key of PRIVATE_KEYS) {
    const wallet = new ethers.Wallet(key, provider);
    try {
      const checkinResult = await performCheckin(wallet);
      const additionalData = await fetchAdditionalData(wallet);
	  console.log('')
    } catch (error) {
      console.error(kleur.red(`Error processing wallet ${wallet.address}: ${error.message}`));
    }
  }
}
dailyCheckin()