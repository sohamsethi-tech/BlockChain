export const uploadToIPFS = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const metadata = JSON.stringify({
    name: file.name,
  });
  formData.append("pinataMetadata", metadata);

  const options = JSON.stringify({
    cidVersion: 1,
  });
  formData.append("pinataOptions", options);

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errMsg = "Failed to upload to IPFS via Pinata";
    try {
      const parsed = JSON.parse(errorBody);
      errMsg = parsed.error?.details || parsed.error || errMsg;
    } catch (_) {
      errMsg = errorBody || errMsg;
    }
    throw new Error(errMsg);
  }

  const data = await response.json();
  return data.IpfsHash;
};