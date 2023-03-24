const express = require("express");
const { createMcdVault, openEmptyMcdVault, mcdSupply } = require("../../helpers/maker/general");
const { getVaultInfo } = require("../../helpers/maker/view");
const hre = require('hardhat');

const router = express.Router();

/**
 * @swagger
 * /maker/general/get-vault:
 *   post:
 *     summary: Fetch info about MCD vault on a fork
 *     tags:
 *      - Maker
 *     description: 
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              forkId:
 *                type: string
 *                example: "98d472f7-496f-4672-be5a-c3eeab31986f"
 *              vaultId:
 *                type: integer
 *                example: 29721
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vaultId:
 *                  type: integer
 *                  example: 29721
 *                 collType:
 *                  type: string
 *                  example: "WSTETH-A"
 *                 coll:
 *                  type: string
 *                  example: "109124124064641358657986"
 *                  description: "Coll amount in wei units"
 *                 debt:
 *                  type: string
 *                  example: "56288199435463558516520615"
 *                  description: "Debt amount in wei units"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post("/get-vault", async (req, res) => {
    let resObj;
    try {
        const { forkId, vaultId } = req.body;

        hre.ethers.provider = await hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
        const vaultInfo = await getVaultInfo(vaultId);
        res.status(200).send(vaultInfo);
    } catch(err){
        resObj = { "error" : "Failed to fetch vault info" };
        res.status(500).send(resObj); 
    }
});

/**
 * @swagger
 * /maker/general/create-vault:
 *   post:
 *     summary: Create a MCD position with given coll and debt for a user
 *     tags:
 *      - Maker
 *     description: 
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              forkId:
 *                type: string
 *                example: "98d472f7-496f-4672-be5a-c3eeab31986f"
 *              senderAcc:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              collType:
 *                type: string
 *                example: "ETH-A"
 *              collAmount:
 *                type: integer
 *                example: 100
 *              debtAmount: 
 *                type: integer
 *                example: 50000
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vaultId:
 *                  type: integer
 *                  example: 42069
 *                 collType:
 *                  type: string
 *                  example: "ETH-A"
 *                 coll:
 *                  type: string
 *                  example: "100000000000000000000"
 *                  description: "Coll amount in wei units"
 *                 debt:
 *                  type: string
 *                  example: "5000000000000000000001"
 *                  description: "Debt amount in wei units"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post("/create-vault", async (req, res) => {
    let resObj;
    try {
        const { forkId, senderAcc, collType, collAmount, debtAmount } = req.body;

        hre.ethers.provider = await hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
        const vaultInfo = await createMcdVault(forkId, collType, collAmount, debtAmount, senderAcc);
        res.status(200).send(vaultInfo);
    } catch(err){
        resObj = { "error" : "Failed to create a position" };
        res.status(500).send(resObj); 
    }
});

/**
 * @swagger
 * /maker/general/open-empty-vault:
 *   post:
 *     summary: Create an empty MCD position with given coll and debt for a user
 *     tags:
 *      - Maker
 *     description: 
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              forkId:
 *                type: string
 *                example: "98d472f7-496f-4672-be5a-c3eeab31986f"
 *              senderAcc:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              collType:
 *                type: string
 *                example: "ETH-A"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vaultId:
 *                  type: integer
 *                  example: 42069
 *                 collType:
 *                  type: string
 *                  example: "ETH-A"
 *                 coll:
 *                  type: string
 *                  example: "0"
 *                  description: "Coll amount in wei units"
 *                 debt:
 *                  type: string
 *                  example: "0"
 *                  description: "Debt amount in wei units"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post("/open-empty-vault", async (req, res) => {
    let resObj;
    try {
        const { forkId, senderAcc, collType } = req.body;

        hre.ethers.provider = await hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
        const vaultInfo = await openEmptyMcdVault(forkId, collType, senderAcc);
        res.status(200).send(vaultInfo);
    } catch(err){
        resObj = { "error" : "Failed to create an empty MCD vault" };
        res.status(500).send(resObj); 
    }
});

/**
 * @swagger
 * /maker/general/supply:
 *   post:
 *     summary: Supplies certain amount of collateral to an existing MCD vault
 *     tags:
 *      - Maker
 *     description: 
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              forkId:
 *                type: string
 *                example: "98d472f7-496f-4672-be5a-c3eeab31986f"
 *              sender:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              vaultId:
 *                type: integer
 *                example: 30375
 *              supplyAmount:
 *                type: integer
 *                example: 50
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vaultId:
 *                  type: integer
 *                  example: 42069
 *                 collType:
 *                  type: string
 *                  example: "ETH-A"
 *                 coll:
 *                  type: string
 *                  example: "100000000000000000000"
 *                  description: "Coll amount in wei units"
 *                 debt:
 *                  type: string
 *                  example: "5000000000000000000001"
 *                  description: "Debt amount in wei units"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post("/supply", async (req, res) => {
    let resObj;
    try {
        const { forkId, sender, vaultId, supplyAmount } = req.body;

        hre.ethers.provider = await hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
        const vaultInfo = await mcdSupply(forkId, sender, vaultId, supplyAmount);
        res.status(200).send(vaultInfo);
    } catch(err){
        resObj = { "error" : "Failed to supply to MCD vault" };
        res.status(500).send(resObj); 
    }
});


module.exports = router;