/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { createMcdVault, openEmptyMcdVault, mcdSupply, mcdWithdraw, mcdBorrow, mcdPayback } = require("../../helpers/maker/general");
const { getVaultInfo } = require("../../helpers/maker/view");
const hre = require("hardhat");

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
    } catch (err) {
        resObj = { error: "Failed to fetch vault info" };
        res.status(500).send(resObj, err);
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
 *              owner:
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
        const { forkId, owner, collType, collAmount, debtAmount } = req.body;

        hre.ethers.provider = await hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
        const vaultInfo = await createMcdVault(forkId, collType, collAmount, debtAmount, owner);

        res.status(200).send(vaultInfo);
    } catch (err) {
        resObj = { error: "Failed to create a position" };
        res.status(500).send(resObj, err);
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
 *              owner:
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
        const { forkId, owner, collType } = req.body;

        hre.ethers.provider = await hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
        const vaultInfo = await openEmptyMcdVault(forkId, collType, owner);

        res.status(200).send(vaultInfo);
    } catch (err) {
        resObj = { error: "Failed to create an empty MCD vault" };
        res.status(500).send(resObj, err);
    }
});

/**
 * @swagger
 * /maker/general/supply:
 *   post:
 *     summary: Supply certain amount of collateral to an existing MCD vault
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
 *              owner:
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
        const { forkId, owner, vaultId, supplyAmount } = req.body;

        hre.ethers.provider = await hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
        const vaultInfo = await mcdSupply(forkId, owner, vaultId, supplyAmount);

        res.status(200).send(vaultInfo);
    } catch (err) {
        resObj = { error: "Failed to supply to MCD vault" };
        res.status(500).send(resObj, err);
    }
});

/**
 * @swagger
 * /maker/general/withdraw:
 *   post:
 *     summary: Withdraw certain amount of collateral from an existing MCD vault
 *     tags:
 *      - Maker
 *     description: Supports sending -1 if you want to withdraw full balance
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
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              vaultId:
 *                type: integer
 *                example: 30375
 *              withdrawAmount:
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
router.post("/withdraw", async (req, res) => {
    let resObj;

    try {
        const { forkId, owner, vaultId, withdrawAmount } = req.body;

        hre.ethers.provider = hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
        const vaultInfo = await mcdWithdraw(forkId, owner, vaultId, withdrawAmount);

        res.status(200).send(vaultInfo);
    } catch (err) {
        resObj = { error: "Failed to withdraw from MCD vault" };
        res.status(500).send(resObj, err);
    }
});

/**
 * @swagger
 * /maker/general/borrow:
 *   post:
 *     summary: Borrow a certain amount of DAI from a MCD vault
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
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              vaultId:
 *                type: integer
 *                example: 30375
 *              borrowAmount:
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
router.post("/borrow", async (req, res) => {
    let resObj;

    try {
        const { forkId, owner, vaultId, borrowAmount } = req.body;

        hre.ethers.provider = await hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
        const vaultInfo = await mcdBorrow(forkId, owner, vaultId, borrowAmount);

        res.status(200).send(vaultInfo);
    } catch (err) {
        resObj = { error: "Failed to supply to MCD vault" };
        res.status(500).send(resObj, err);
    }
});

/**
 * @swagger
 * /maker/general/payback:
 *   post:
 *     summary: Payback certain amount of DAI debt to a MCD vault
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
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              vaultId:
 *                type: integer
 *                example: 30375
 *              paybackAmount:
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
router.post("/payback", async (req, res) => {
    let resObj;

    try {
        const { forkId, owner, vaultId, paybackAmount } = req.body;

        hre.ethers.provider = await hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
        const vaultInfo = await mcdPayback(forkId, owner, vaultId, paybackAmount);

        res.status(200).send(vaultInfo);
    } catch (err) {
        resObj = { error: "Failed to payback to MCD vault" };
        res.status(500).send(resObj, err);
    }
});

module.exports = router;