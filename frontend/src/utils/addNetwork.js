export const addNetwork = async (network) => {
  await window.ethereum.request({
    method: "wallet_addEthereumChain",
    params: [network],
  });
};