/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { createMcdVault, openEmptyMcdVault, mcdSupply, mcdWithdraw, mcdBorrow, mcdPayback, mcdDsrWithdraw, mcdDsrDeposit } = require("../../helpers/maker/general");
const { getVaultInfo } = require("../../helpers/maker/view");
const { setupVnet, getSmartWallet, defaultsToSafe } = require("../../utils");
const { body, validationResult } = require("express-validator");

const router = express.Router();

/**
 * @swagger
 * /maker/general/get-vault:
 *   post:
 *     summary: Fetch info about MCD vault on a vnet
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
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
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
router.post("/get-vault",
    body(["vnetUrl", "vaultId"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, vaultId } = req.body;

        await setupVnet(vnetUrl);
        return getVaultInfo(vaultId)
            .then(vaultInfo => {
                res.status(200).send(vaultInfo);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to fetch vault info with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /maker/general/create-vault/smart-wallet:
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
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - collType
 *               - collAmount
 *               - debtAmount
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              collType:
 *                type: string
 *                example: "ETH-A"
 *              collAmount:
 *                type: number
 *                example: 100
 *                description: "Amount of collateral to supply in token units (e.g., 100 for 100 ETH, 1.5 for 1.5 ETH). Not USD value. Supports decimals."
 *              debtAmount:
 *                type: number
 *                example: 50000
 *                description: "Amount of debt to borrow in token units (e.g., 50000 for 50000 DAI, 1000.25 for 1000.25 DAI). Not USD value. Supports decimals."
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
router.post("/create-vault/smart-wallet",
    body(["vnetUrl", "collType", "eoa"]).notEmpty(),
    body("collAmount").notEmpty().isNumeric(),
    body("debtAmount").notEmpty().isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, collType, collAmount, debtAmount } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return createMcdVault(collType, collAmount, debtAmount, eoa, getSmartWallet(req), defaultsToSafe(req))
            .then(vaultInfo => {
                res.status(200).send(vaultInfo);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to create vault info with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /maker/general/open-empty-vault/smart-wallet:
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
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - collType
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              collType:
 *                type: string
 *                example: "ETH-A"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
router.post("/open-empty-vault/smart-wallet",
    body(["vnetUrl", "collType", "eoa"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, collType } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return openEmptyMcdVault(collType, eoa, getSmartWallet(req), defaultsToSafe(req))
            .then(vaultInfo => {
                res.status(200).send(vaultInfo);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to create an empty vault info with error : ${err.toString()}` });
            });
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
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - vaultId
 *               - supplyAmount
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              vaultId:
 *                type: integer
 *                example: 30375
 *              supplyAmount:
 *                type: number
 *                example: 50
 *                description: "Amount of collateral to supply in token units (supports decimals)"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
router.post("/supply",
    body(["vnetUrl", "vaultId", "eoa"]).notEmpty(),
    body("supplyAmount").notEmpty().isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, vaultId, supplyAmount } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return mcdSupply(eoa, vaultId, supplyAmount, getSmartWallet(req), defaultsToSafe(req))
            .then(vaultInfo => {
                res.status(200).send(vaultInfo);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to supply to an MCD vault info with error : ${err.toString()}` });
            });
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
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - vaultId
 *               - withdrawAmount
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              vaultId:
 *                type: integer
 *                example: 30375
 *              withdrawAmount:
 *                type: number
 *                example: 50
 *                description: "Amount of collateral to withdraw in token units (supports decimals, -1 for full withdrawal)"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
router.post("/withdraw",
    body(["vnetUrl", "vaultId", "eoa"]).notEmpty(),
    body("withdrawAmount").notEmpty().isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, vaultId, withdrawAmount } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return mcdWithdraw(eoa, vaultId, withdrawAmount, getSmartWallet(req), defaultsToSafe(req))
            .then(vaultInfo => {
                res.status(200).send(vaultInfo);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to withdraw from an MCD vault info with error : ${err.toString()}` });
            });
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
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - vaultId
 *               - borrowAmount
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              vaultId:
 *                type: integer
 *                example: 30375
 *              borrowAmount:
 *                type: number
 *                example: 50000
 *                description: "Amount of DAI to borrow in token units (supports decimals)"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
router.post("/borrow",
    body(["vnetUrl", "vaultId", "eoa"]).notEmpty(),
    body("borrowAmount").notEmpty().isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, vaultId, borrowAmount } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return mcdBorrow(eoa, vaultId, borrowAmount, getSmartWallet(req), defaultsToSafe(req))
            .then(vaultInfo => {
                res.status(200).send(vaultInfo);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to borrow from an MCD vault info with error : ${err.toString()}` });
            });
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
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - vaultId
 *               - paybackAmount
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              vaultId:
 *                type: integer
 *                example: 30375
 *              paybackAmount:
 *                type: number
 *                example: 50
 *                description: "Amount of DAI to payback in token units (supports decimals, -1 for full payback)"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
router.post("/payback",
    body(["vnetUrl", "vaultId", "eoa"]).notEmpty(),
    body("paybackAmount").notEmpty().isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, vaultId, paybackAmount } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return mcdPayback(eoa, vaultId, paybackAmount, getSmartWallet(req), defaultsToSafe(req))
            .then(vaultInfo => {
                res.status(200).send(vaultInfo);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to payback an MCD vault info with error : ${err.toString()}` });
            });
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
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - amount
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              amount:
 *                type: number
 *                example: 2000
 *                description: "Amount of DAI to deposit in token units (supports decimals)"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: integer
 *               example: 2000
 *               descripition: "Amount of DAI in DSR after deposit"
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
router.post("/dsr-deposit",
    body(["vnetUrl", "eoa"]).notEmpty(),
    body("amount").notEmpty().isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, amount } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return mcdDsrDeposit(eoa, amount, getSmartWallet(req), defaultsToSafe(req))
            .then(vaultInfo => {
                res.status(200).send(vaultInfo);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to deposit into Maker DSR with error : ${err.toString()}` });
            });
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
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - amount
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              amount:
 *                type: number
 *                example: 2000
 *                description: "Amount of DAI to withdraw in token units (supports decimals)"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: integer
 *               example: 2000
 *               descripition: "Amount of DAI in DSR after withdraw"
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
router.post("/dsr-withdraw",
    body(["vnetUrl", "eoa"]).notEmpty(),
    body("amount").notEmpty().isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, amount } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return mcdDsrWithdraw(eoa, amount, getSmartWallet(req), defaultsToSafe(req))
            .then(vaultInfo => {
                res.status(200).send(vaultInfo);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to withdraw from Maker DSR with error : ${err.toString()}` });
            });
    });

module.exports = router;
