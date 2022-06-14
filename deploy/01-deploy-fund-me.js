// How to deploy the fundme.sol contract using hardhat-deploy

//imports

// Non proper way of deploying

// async function deployFunc(hre) {
//     console.log("hi")
// }

// // don't put parentheses on deployFunc
// module.exports.default = deployFunc

// Proper way to deploy (See fcc github repo for more info)

// importing the network addresses from the helper-hardhat-config file
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { verify } = require("../utils/verify")

// same thing as:
// const helperConfig = require("../helper-hardhat-config")
// const networkConfig = helperConfig.networkConfig
// just an easy way to pull out network config

module.exports = async ({ getNamedAccounts, deployments }) => {
    // Pulls variables out of hre
    //const { getNamedAccounts, deployments } = hre
    // ^ is what is being done in the function declaration
    // same as
    // hre.getNamedAccounts & hre.deployments

    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    // getNamedAccounts() is a way to get named accounts
    // assigns a name to each private key in a list of accounts
    // just makes it less confusing to look at
    // so this gives us the deployer account from our naned accounts
    // which can be found in hardhat.config.js

    const chainId = network.config.chainId
    // gives us the chainId

    // well what happens when we want to change chains?
    // when going for localhost or hardhat network we want to use a mock

    // assigns the correct address for whatever network we decide to use
    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    // use let so it can be updated
    if (developmentChains.includes(network.name)) {
        // gets the most recent deployment
        const ethUsdAggregator = await get("MockV3Aggregator")
        // imported at the top

        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    // if the contract doesn't exist, we deploy a minimal version of it
    // for our local testing (mocking)

    // deploy("contract", {list of overrides})
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        // account paying for the deploy I guess?
        from: deployer,
        // arguments passed to constructor (priceFeedAddress)
        // look to helper-hardhat-config.js for setting it up
        args: args, // put price feed address
        // Gets ride of console logging
        log: true,
        // set in hardhat.config
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // Set up for etherscan verification
    // checks if its not a development chain and if
    // the api key exists
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }
    log("---------------------------------------------------------")
}

module.exports.tags = ["all", "fundme"]
