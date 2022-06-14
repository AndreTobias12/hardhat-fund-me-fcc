// 00 is because we only use this sometimes

const { network } = require("hardhat")
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // check if variable is inside array
    // netowrk.name will check for things like "rinkeby"
    // because our helper-config is using names not chainId's
    if (developmentChains.includes(network.name)) {
        // essentially console.log
        log("Local network detected! Deploying mocks...")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            // check github or @chainlink in nodemodules
            // this will show you the contract and what
            // arguments need to be passed to the constructor
            args: [DECIMALS, INITIAL_ANSWER],
        })
        log("Mocks deployed!")
        log("---------------------------------------")
        // signifies end of deploy script anything after this is a new
        // deploy script
    }
}

module.exports.tags = ["all", "mocks"]
// yarn hardhat deploy --tags mocks
// this will only deploy our mocks contract
