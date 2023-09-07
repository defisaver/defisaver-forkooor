/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { createMcdVault, openEmptyMcdVault, mcdSupply, mcdWithdraw, mcdBorrow, mcdPayback, mcdDsrWithdraw, mcdDsrDeposit } = require("../../helpers/maker/general");
const { getVaultInfo } = require("../../helpers/maker/view");
const { setupFork } = require("../../utils");

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
 *                example: "29490d5a-f4ca-41fd-89db-fd19ea82d44b"
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

        await setupFork(forkId);
        const vaultInfo = await getVaultInfo(vaultId);

        res.status(200).send(vaultInfo);
    } catch (err) {
        resObj = { error: `Failed to fetch vault info with error : ${err.toString()}` };
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
 *                example: "29490d5a-f4ca-41fd-89db-fd19ea82d44b"
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

        await setupFork(forkId, [owner]);
        const vaultInfo = await createMcdVault(collType, collAmount, debtAmount, owner);

        res.status(200).send(vaultInfo);
    } catch (err) {
        resObj = { error: `Failed to create vault info with error : ${err.toString()}` };
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
 *                example: "29490d5a-f4ca-41fd-89db-fd19ea82d44b"
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

        await setupFork(forkId, [owner]);
        const vaultInfo = await openEmptyMcdVault(collType, owner);

        res.status(200).send(vaultInfo);
    } catch (err) {
        resObj = { error: `Failed to create an empty vault info with error : ${err.toString()}` };
        res.status(500).send(resObj);
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
 *                example: "29490d5a-f4ca-41fd-89db-fd19ea82d44b"
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

        await setupFork(forkId, [owner]);
        const vaultInfo = await mcdSupply(owner, vaultId, supplyAmount);

        res.status(200).send(vaultInfo);
    } catch (err) {
        resObj = { error: `Failed to supply to an MCD vault info with error : ${err.toString()}` };
        res.status(500).send(resObj);
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
 *                example: "29490d5a-f4ca-41fd-89db-fd19ea82d44b"
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

        await setupFork(forkId, [owner]);
        const vaultInfo = await mcdWithdraw(owner, vaultId, withdrawAmount);

        res.status(200).send(vaultInfo);
    } catch (err) {
        resObj = { error: `Failed to withdraw from an MCD vault info with error : ${err.toString()}` };
        res.status(500).send(resObj);
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
 *                example: "29490d5a-f4ca-41fd-89db-fd19ea82d44b"
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

        await setupFork(forkId, [owner]);
        const vaultInfo = await mcdBorrow(owner, vaultId, borrowAmount);

        res.status(200).send(vaultInfo);
    } catch (err) {
        resObj = { error: `Failed to borrow from an MCD vault info with error : ${err.toString()}` };
        res.status(500).send(resObj);
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
 *                example: "29490d5a-f4ca-41fd-89db-fd19ea82d44b"
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

        await setupFork(forkId, [owner]);
        const vaultInfo = await mcdPayback(owner, vaultId, paybackAmount);

        res.status(200).send(vaultInfo);
    } catch (err) {
        resObj = { error: `Failed to payback an MCD vault info with error : ${err.toString()}` };
        res.status(500).send(resObj, err);
    }
});

/**
 * @swagger
 * /maker/general/dsr-deposit:
 *   post:
 *     summary: Deposit certain amount of DAI into Maker DSR
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
 *                example: "29490d5a-f4ca-41fd-89db-fd19ea82d44b"
 *              sender:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              amount:
 *                type: integer
 *                example: 2000
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: integer
 *               example: 2000
 *               descripition: "Amount of dai in DSR"
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
router.post("/dsr-deposit", async (req, res) => {
    let resObj;

    try {
        const { forkId, sender, amount } = req.body;

        await setupFork(forkId, [sender]);
        const vaultInfo = await mcdDsrDeposit(sender, amount);

        res.status(200).send(vaultInfo);
    } catch (err) {
        resObj = { error: `Failed to deposit into Maker DSR with error : ${err.toString()}` };
        res.status(500).send(resObj, err);
    }
});

/**
 * @swagger
 * /maker/general/dsr-withdraw:
 *   post:
 *     summary: Withdraw certain amount of DAI from Maker DSR
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
 *                example: "29490d5a-f4ca-41fd-89db-fd19ea82d44b"
 *              sender:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              amount:
 *                type: integer
 *                example: 2000
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: integer
 *               example: 2000
 *               descripition: "Amount of dai in DSR"
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
router.post("/dsr-withdraw", async (req, res) => {
    let resObj;

    try {
        const { forkId, sender, amount } = req.body;

        await setupFork(forkId, [sender]);
        const vaultInfo = await mcdDsrWithdraw(sender, amount);

        res.status(200).send(vaultInfo);
    } catch (err) {
        resObj = { error: `Failed to withdraw from Maker DSR with error : ${err.toString()}` };
        res.status(500).send(resObj, err);
    }
});

module.exports = router;
