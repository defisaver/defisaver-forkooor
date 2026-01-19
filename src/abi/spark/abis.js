const sparkViewAbi = [
    {
        inputs: [
            { internalType: "address", name: "_market", type: "address" },
            { internalType: "address[]", name: "_tokenAddresses", type: "address[]" }
        ],
        name: "getFullTokensInfo",
        outputs: [
            {
                components: [
                    { internalType: "address", name: "aTokenAddress", type: "address" },
                    {
                        internalType: "address",
                        name: "underlyingTokenAddress",
                        type: "address"
                    },
                    { internalType: "uint16", name: "assetId", type: "uint16" },
                    { internalType: "uint256", name: "supplyRate", type: "uint256" },
                    {
                        internalType: "uint256",
                        name: "borrowRateVariable",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "borrowRateStable",
                        type: "uint256"
                    },
                    { internalType: "uint256", name: "totalSupply", type: "uint256" },
                    {
                        internalType: "uint256",
                        name: "availableLiquidity",
                        type: "uint256"
                    },
                    { internalType: "uint256", name: "totalBorrow", type: "uint256" },
                    { internalType: "uint256", name: "totalBorrowVar", type: "uint256" },
                    { internalType: "uint256", name: "totalBorrowStab", type: "uint256" },
                    {
                        internalType: "uint256",
                        name: "collateralFactor",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "liquidationRatio",
                        type: "uint256"
                    },
                    { internalType: "uint256", name: "price", type: "uint256" },
                    { internalType: "uint256", name: "supplyCap", type: "uint256" },
                    { internalType: "uint256", name: "borrowCap", type: "uint256" },
                    { internalType: "uint256", name: "emodeCategory", type: "uint256" },
                    {
                        internalType: "uint256",
                        name: "debtCeilingForIsolationMode",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "isolationModeTotalDebt",
                        type: "uint256"
                    },
                    {
                        internalType: "bool",
                        name: "usageAsCollateralEnabled",
                        type: "bool"
                    },
                    { internalType: "bool", name: "borrowingEnabled", type: "bool" },
                    {
                        internalType: "bool",
                        name: "stableBorrowRateEnabled",
                        type: "bool"
                    },
                    {
                        internalType: "bool",
                        name: "isolationModeBorrowingEnabled",
                        type: "bool"
                    },
                    { internalType: "bool", name: "isSiloedForBorrowing", type: "bool" },
                    {
                        internalType: "uint256",
                        name: "eModeCollateralFactor",
                        type: "uint256"
                    },
                    { internalType: "bool", name: "isFlashLoanEnabled", type: "bool" },
                    { internalType: "uint16", name: "ltv", type: "uint16" },
                    {
                        internalType: "uint16",
                        name: "liquidationThreshold",
                        type: "uint16"
                    },
                    { internalType: "uint16", name: "liquidationBonus", type: "uint16" },
                    { internalType: "address", name: "priceSource", type: "address" },
                    { internalType: "string", name: "label", type: "string" },
                    { internalType: "bool", name: "isActive", type: "bool" },
                    { internalType: "bool", name: "isPaused", type: "bool" },
                    { internalType: "bool", name: "isFrozen", type: "bool" }
                ],
                internalType: "struct SparkView.TokenInfoFull[]",
                name: "tokens",
                type: "tuple[]"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "_market", type: "address" },
            { internalType: "address", name: "_user", type: "address" }
        ],
        name: "getLoanData",
        outputs: [
            {
                components: [
                    { internalType: "address", name: "user", type: "address" },
                    { internalType: "uint128", name: "ratio", type: "uint128" },
                    { internalType: "uint256", name: "eMode", type: "uint256" },
                    { internalType: "address[]", name: "collAddr", type: "address[]" },
                    { internalType: "bool[]", name: "enabledAsColl", type: "bool[]" },
                    { internalType: "address[]", name: "borrowAddr", type: "address[]" },
                    { internalType: "uint256[]", name: "collAmounts", type: "uint256[]" },
                    {
                        internalType: "uint256[]",
                        name: "borrowStableAmounts",
                        type: "uint256[]"
                    },
                    {
                        internalType: "uint256[]",
                        name: "borrowVariableAmounts",
                        type: "uint256[]"
                    },
                    { internalType: "uint16", name: "ltv", type: "uint16" },
                    {
                        internalType: "uint16",
                        name: "liquidationThreshold",
                        type: "uint16"
                    },
                    { internalType: "uint16", name: "liquidationBonus", type: "uint16" },
                    { internalType: "address", name: "priceSource", type: "address" },
                    { internalType: "string", name: "label", type: "string" }
                ],
                internalType: "struct SparkView.LoanData",
                name: "data",
                type: "tuple"
            }
        ],
        stateMutability: "view",
        type: "function"
    }
];
const sparkSubProxyAbi = [
    {
        inputs: [
            { internalType: "uint64", name: "_repayBundleId", type: "uint64" },
            { internalType: "uint64", name: "_boostBundleId", type: "uint64" }
        ],
        stateMutability: "nonpayable",
        type: "constructor"
    },
    { inputs: [], name: "NonContractCall", type: "error" },
    {
        inputs: [
            { internalType: "uint128", name: "ratio", type: "uint128" },
            { internalType: "uint128", name: "targetRatio", type: "uint128" }
        ],
        name: "RangeTooClose",
        type: "error"
    },
    { inputs: [], name: "SenderNotAdmin", type: "error" },
    { inputs: [], name: "SenderNotOwner", type: "error" },
    {
        inputs: [
            { internalType: "uint128", name: "minRatio", type: "uint128" },
            { internalType: "uint128", name: "maxRatio", type: "uint128" }
        ],
        name: "WrongSubParams",
        type: "error"
    },
    {
        inputs: [],
        name: "BOOST_BUNDLE_ID",
        outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "EXECUTE_SELECTOR",
        outputs: [{ internalType: "bytes4", name: "", type: "bytes4" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "REPAY_BUNDLE_ID",
        outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "SPARK_MARKET",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "bytes", name: "encodedInput", type: "bytes" }],
        name: "activateSub",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "adminVault",
        outputs: [
            { internalType: "contract AdminVault", name: "", type: "address" }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "bytes", name: "encodedInput", type: "bytes" }],
        name: "deactivateSub",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                components: [
                    { internalType: "uint128", name: "minRatio", type: "uint128" },
                    { internalType: "uint128", name: "maxRatio", type: "uint128" },
                    {
                        internalType: "uint128",
                        name: "targetRatioBoost",
                        type: "uint128"
                    },
                    {
                        internalType: "uint128",
                        name: "targetRatioRepay",
                        type: "uint128"
                    },
                    { internalType: "bool", name: "boostEnabled", type: "bool" }
                ],
                internalType: "struct SparkSubProxy.SparkSubData",
                name: "_user",
                type: "tuple"
            }
        ],
        name: "formatBoostSub",
        outputs: [
            {
                components: [
                    {
                        internalType: "uint64",
                        name: "strategyOrBundleId",
                        type: "uint64"
                    },
                    { internalType: "bool", name: "isBundle", type: "bool" },
                    { internalType: "bytes[]", name: "triggerData", type: "bytes[]" },
                    { internalType: "bytes32[]", name: "subData", type: "bytes32[]" }
                ],
                internalType: "struct StrategyModel.StrategySub",
                name: "boostSub",
                type: "tuple"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                components: [
                    { internalType: "uint128", name: "minRatio", type: "uint128" },
                    { internalType: "uint128", name: "maxRatio", type: "uint128" },
                    {
                        internalType: "uint128",
                        name: "targetRatioBoost",
                        type: "uint128"
                    },
                    {
                        internalType: "uint128",
                        name: "targetRatioRepay",
                        type: "uint128"
                    },
                    { internalType: "bool", name: "boostEnabled", type: "bool" }
                ],
                internalType: "struct SparkSubProxy.SparkSubData",
                name: "_user",
                type: "tuple"
            }
        ],
        name: "formatRepaySub",
        outputs: [
            {
                components: [
                    {
                        internalType: "uint64",
                        name: "strategyOrBundleId",
                        type: "uint64"
                    },
                    { internalType: "bool", name: "isBundle", type: "bool" },
                    { internalType: "bytes[]", name: "triggerData", type: "bytes[]" },
                    { internalType: "bytes32[]", name: "subData", type: "bytes32[]" }
                ],
                internalType: "struct StrategyModel.StrategySub",
                name: "repaySub",
                type: "tuple"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "_contractAddr", type: "address" }
        ],
        name: "givePermission",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "kill",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "bytes", name: "encodedInput", type: "bytes" }],
        name: "parseSubData",
        outputs: [
            {
                components: [
                    { internalType: "uint128", name: "minRatio", type: "uint128" },
                    { internalType: "uint128", name: "maxRatio", type: "uint128" },
                    {
                        internalType: "uint128",
                        name: "targetRatioBoost",
                        type: "uint128"
                    },
                    {
                        internalType: "uint128",
                        name: "targetRatioRepay",
                        type: "uint128"
                    },
                    { internalType: "bool", name: "boostEnabled", type: "bool" }
                ],
                internalType: "struct SparkSubProxy.SparkSubData",
                name: "user",
                type: "tuple"
            }
        ],
        stateMutability: "pure",
        type: "function"
    },
    {
        inputs: [{ internalType: "bytes", name: "encodedInput", type: "bytes" }],
        name: "parseSubIds",
        outputs: [
            { internalType: "uint32", name: "subId1", type: "uint32" },
            { internalType: "uint32", name: "subId2", type: "uint32" }
        ],
        stateMutability: "pure",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "_contractAddr", type: "address" }
        ],
        name: "removePermission",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "bytes", name: "encodedInput", type: "bytes" }],
        name: "subToSparkAutomation",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "bytes", name: "encodedInput", type: "bytes" }],
        name: "updateSubData",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "_token", type: "address" },
            { internalType: "address", name: "_receiver", type: "address" },
            { internalType: "uint256", name: "_amount", type: "uint256" }
        ],
        name: "withdrawStuckFunds",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    }
];

module.exports = {
    sparkViewAbi,
    sparkSubProxyAbi
};
