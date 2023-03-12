const botAuthAbi = [
  {
    inputs: [{ internalType: "address", name: "_caller", type: "address" }],
    name: "addCaller",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
const dfsRegistryAbi = [
  {
    inputs: [{ internalType: "bytes4", name: "_id", type: "bytes4" }],
    name: "getAddr",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];
const iProxyERC20Abi = [
    {
        inputs: [],
        name: "target",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "tokenState",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
      },
];

const erc20Abi = [
    {
        inputs: [],
        name: "decimals",
        outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
      },
]

module.exports = {
    botAuthAbi,
    dfsRegistryAbi,
    iProxyERC20Abi,
    erc20Abi,
}