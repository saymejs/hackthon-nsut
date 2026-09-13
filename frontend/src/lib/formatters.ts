import { formatEther } from "viem";

export const DEFAULT_ETH_PRICE_USD = 2500;

export function ethToUsd(
  amountInEth: number | string,
  price: number = DEFAULT_ETH_PRICE_USD
): string {
  const val = typeof amountInEth === "string" ? parseFloat(amountInEth) : amountInEth;
  if (isNaN(val)) return "$0.00";
  const usd = val * price;
  return `$${usd.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatEthAndUsd(
  amountInEth: number | string,
  price: number = DEFAULT_ETH_PRICE_USD
): string {
  const val = typeof amountInEth === "string" ? parseFloat(amountInEth) : amountInEth;
  if (isNaN(val)) return "0.0000 ETH (~$0.00)";
  return `${val.toFixed(4)} ETH (~${ethToUsd(val, price)})`;
}

export function formatWeiAndUsd(
  amountInWei: bigint | string | number,
  price: number = DEFAULT_ETH_PRICE_USD
): string {
  try {
    const ethVal = parseFloat(formatEther(BigInt(amountInWei)));
    return formatEthAndUsd(ethVal, price);
  } catch {
    return "0.0000 ETH (~$0.00)";
  }
}
