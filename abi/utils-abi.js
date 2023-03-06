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

module.exports = {
    botAuthAbi,
    dfsRegistryAbi
}