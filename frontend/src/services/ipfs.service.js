import { Web3Storage } from "web3.storage";

const client = new Web3Storage({
  token: import.meta.env.VITE_WEB3_STORAGE_TOKEN,
});

export const uploadToIPFS = async (file) => {
  const cid = await client.put([file]);
  return cid;
};