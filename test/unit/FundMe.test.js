// How to properly set up unit tests

// Imports assert to use in testing
const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

// describe("contract", function)
// For the entire contract
!developmentChains.includes(network.name)
    ? // decscribe.skip will skip everything here if we are on a development chain
      describe.skip
    : describe("FundMe", async function () {
          // Deploy the contract first
          let fundMe
          let deployer
          let mockV3Aggregator
          // an easy way to write 1 ETH without having to use 18 zeros
          const sendValue = ethers.utils.parseEther("1") // 1 ETH
          beforeEach(async function () {
              // deploy our fundMe contract
              // using Hardhat-deploy

              // This allows us to tell ethers which account we want c
              // connected to fundMe
              deployer = (await getNamedAccounts()).deployer

              // Another way to get accounts directly from hardhat-config:
              // const accounts = await ethers.getSigners()
              // const accountZero = accounts[0]
              // this will return whateer is in the accounts section of your network

              // allows us to run our entire deploy folder
              // with as many tags as we want
              await deployments.fixture(["all"])
              // by adding the "all" tag to each file in the deploy folder
              // fixture can run all of them with just this one line

              // Gets us the most recent deployment of whatever contract we tell it
              fundMe = await ethers.getContract("FundMe", deployer)
              // Now whenever we call a function from fundMe it will automatically
              // be from that deployer account
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          // Just for the constructor function inside the contract
          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async function () {
              it("Fails if you don't send enough ETH", async function () {
                  // tells the test that the function should fail
                  // also should fail with an exact failure message
                  // uses waffle testing?
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("Updated the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )

                  // response will be the big number version of how much was funded
                  // by that account (so .toString() is required)
                  // sendValue works the exact same
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of getFunder", async function () {
                  // Passing values to a function
                  await fundMe.fund({ value: sendValue })

                  // Accessing items in an array
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })
          describe("withdraw", async function () {
              // Fund the contract first
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraw ETH from a single founder", async function () {
                  // Set up for a test
                  // Arrange

                  // Start with fundMe balance after it has been funded with
                  // some ETH
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(
                          // Provider object allows us to use the getBalance function
                          fundMe.address
                      )
                  // Get the starting balance of the deployer
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // This way we can test how much the balances have changed based
                  // off of what happens when we call the withdraw function

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  // Pulls out the gasUsed and effectiveGasPrice from the transaction
                  // then calculates the total gas cost
                  // (so it can then be used in the test below)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // Get ending balances after calling the withdraw function
                  // then we can compare and see if the numbers match what
                  // should happen
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      // use .add() just because of the big number thing
                      // use .toString() as well
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      // have to add the gasCost or this won't add up correctly
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })

              it("Cheaper single withdraw testing...", async function () {
                  // Set up for a test
                  // Arrange

                  // Start with fundMe balance after it has been funded with
                  // some ETH
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(
                          // Provider object allows us to use the getBalance function
                          fundMe.address
                      )
                  // Get the starting balance of the deployer
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // This way we can test how much the balances have changed based
                  // off of what happens when we call the withdraw function

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  // Pulls out the gasUsed and effectiveGasPrice from the transaction
                  // then calculates the total gas cost
                  // (so it can then be used in the test below)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // Get ending balances after calling the withdraw function
                  // then we can compare and see if the numbers match what
                  // should happen
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      // use .add() just because of the big number thing
                      // use .toString() as well
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      // have to add the gasCost or this won't add up correctly
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })

              it("allows us to withdraw with multiple getFunder", async function () {
                  const accounts = await ethers.getSigners()
                  // Arrange

                  // index 0 is deployer
                  for (let i = 1; i < 6; i++) {
                      // need to create new objects to connect to all these accounts
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  // Start with fundMe balance after it has been funded with
                  // some ETH
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(
                          // Provider object allows us to use the getBalance function
                          fundMe.address
                      )
                  // Get the starting balance of the deployer
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  // Pulls out the gasUsed and effectiveGasPrice from the transaction
                  // then calculates the total gas cost
                  // (so it can then be used in the test below)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // Assert

                  // Get ending balances after calling the withdraw function
                  // then we can compare and see if the numbers match what
                  // should happen
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      // use .add() just because of the big number thing
                      // use .toString() as well
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      // have to add the gasCost or this won't add up correctly
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // Make sure that the getFunder are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })

              it("CheaperWithdraw testing...", async function () {
                  const accounts = await ethers.getSigners()
                  // Arrange

                  // index 0 is deployer
                  for (let i = 1; i < 6; i++) {
                      // need to create new objects to connect to all these accounts
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  // Start with fundMe balance after it has been funded with
                  // some ETH
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(
                          // Provider object allows us to use the getBalance function
                          fundMe.address
                      )
                  // Get the starting balance of the deployer
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  // Pulls out the gasUsed and effectiveGasPrice from the transaction
                  // then calculates the total gas cost
                  // (so it can then be used in the test below)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // Assert

                  // Get ending balances after calling the withdraw function
                  // then we can compare and see if the numbers match what
                  // should happen
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      // use .add() just because of the big number thing
                      // use .toString() as well
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      // have to add the gasCost or this won't add up correctly
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // Make sure that the getFunder are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
          })
      })
