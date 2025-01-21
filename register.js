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
const referralCode = 'iUA17U';

async function checkAccount(wallet) {
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
      console.log(kleur.blue(`Rank: ${userData.rank} | Points: ${userData.points} | Verified Status: ${userData.verifiedStatus} for ${wallet.address}`));
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

async function fetchAirdropUser(wallet) {
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
		  const fistCheckin = await performCheckin(wallet);
	      await loading(`Follow Task...`, 2000);
          const followMissin = await followTask(wallet);
	      await loading(`Hold ETH Task...`, 2000);
	      const ethMission = await holdETH(wallet);
	      await loading(`Hold LSK Task...`, 2000);
	      const lskMission = await holdLSK(wallet);
	      await loading(`Hold USDC Task...`, 2000);
	      const usdcMission = await holdUSDC(wallet);
	      await loading(`Hold USDT Task...`, 2000);
	      const usdtMission = await holdUSDT(wallet);
	      await loading(`Checking User data...`, 2000);
	      const dataAccount = await checkAccount(wallet);
          console.log('All Done');
          break;

        case "IS_GUILD_VERIFIED":
          await loading(`User is guild verified, Register user to Airdrop`, 6000);
          await addAirdropUser(wallet, referralCode);
		  await loading(`Checkin Task...`, 2000);
		  const fistCheckin = await performCheckin(wallet);
	      await loading(`Follow Task...`, 2000);
          const followMissin = await followTask(wallet);
	      await loading(`Hold ETH Task...`, 2000);
	      const ethMission = await holdETH(wallet);
	      await loading(`Hold LSK Task...`, 2000);
	      const lskMission = await holdLSK(wallet);
	      await loading(`Hold USDC Task...`, 2000);
	      const usdcMission = await holdUSDC(wallet);
	      await loading(`Hold USDT Task...`, 2000);
	      const usdtMission = await holdUSDT(wallet);
	      await loading(`Checking User data...`, 2000);
	      const dataAccount = await checkAccount(wallet);
          console.log('All Done');
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

async function addAirdropUser(wallet, referralCode) {
  try {
    const response = await axios.post("https://portal-api.lisk.com/graphql", {
      query: `
        mutation AddAirdropUser($input: CreateUserInputData) {
          userdrop {
            addUser(input: $input) {
              success
              userInfo {
                address
                verifiedStatus
                referrals {
                  code
                }
              }
            }
          }
        }
      `,
      variables: {
        input: {
          address: wallet.address,
          referralCode: referralCode,
        },
      },
    });

    const result = response.data?.data?.userdrop?.addUser;
    if (result?.success) {
      console.log(kleur.green(`Register User successfully: ${wallet.address} with referral code ${referralCode}`));
    } else {
      console.log(kleur.red(`Failed to add user for ${wallet.address}`));
    }
    return response.data;
  } catch (error) {
    console.error(
      kleur.red(`Error adding user for ${wallet.address}: `),
      error.message
    );
    throw error;
  }
}
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
async function followTask(wallet) {
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
          taskID: 11,
        },
      },
    });

    console.log(kleur.green(`Follow Task successful for ${wallet.address}`));
    return response.data;
  } catch (error) {
    console.error(
      kleur.yellow(`Follow Task failed for ${wallet.address}: `),
      error.message
    );
    throw error;
  }
}
async function holdETH(wallet) {
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
          taskID: 6,
        },
      },
    });
    if (response.data.errors) {
      const errorMessage = response.data.errors[0]?.message || "Unknown error";
      console.error(kleur.red(`Hold ETH Task failed for ${wallet.address}: ${errorMessage}`));
      return {
        success: false,
        message: errorMessage,
      };
    }
    console.log(kleur.green(`Hold ETH Task successful for ${wallet.address}`));
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(
      kleur.yellow(`Hold ETH failed for ${wallet.address}: `),
      error.message
    );
    throw error;
  }
}
async function holdLSK(wallet) {
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
          taskID: 7,
        },
      },
    });
    if (response.data.errors) {
      const errorMessage = response.data.errors[0]?.message || "Unknown error";
      console.error(kleur.red(`Hold LSK Task failed for ${wallet.address}: ${errorMessage}`));
      return {
        success: false,
        message: errorMessage,
      };
    }
    console.log(kleur.green(`Hold LSK( Task successful for ${wallet.address}`));
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(
      kleur.yellow(`Hold LSK( failed for ${wallet.address}: `),
      error.message
    );
    throw error;
  }
}
async function holdUSDC(wallet) {
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
          taskID: 8,
        },
      },
    });
    if (response.data.errors) {
      const errorMessage = response.data.errors[0]?.message || "Unknown error";
      console.error(kleur.red(`Hold USDC Task failed for ${wallet.address}: ${errorMessage}`));
      return {
        success: false,
        message: errorMessage,
      };
    }
    console.log(kleur.green(`Hold USDC Task successful for ${wallet.address}`));
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(
      kleur.yellow(`Hold USDC failed for ${wallet.address}: `),
      error.message
    );
    throw error;
  }
}
async function holdUSDT(wallet) {
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
          taskID: 9,
        },
      },
    });
    if (response.data.errors) {
      const errorMessage = response.data.errors[0]?.message || "Unknown error";
      console.error(kleur.red(`Hold USDT Task failed for ${wallet.address}: ${errorMessage}`));
      return {
        success: false,
        message: errorMessage,
      };
    }
    console.log(kleur.green(`Hold USDT Task successful for ${wallet.address}`));
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(
      kleur.yellow(`Hold USDT failed for ${wallet.address}: `),
      error.message
    );
    throw error;
  }
}
async function runRegister() {
  header();
  for (const key of PRIVATE_KEYS) {
    const wallet = new ethers.Wallet(key, provider);
    try {
	  await loading(`Fetching User Data`, 6000);
      const fetchUser = await fetchAirdropUser(wallet);
      console.log('');
    } catch (error) {
      console.error(kleur.red(`Error processing wallet ${wallet.address}: ${error.message}`));
    }
  }
}

runRegister();
