"use client";

import { useState } from "react";
import { createWalletClient, custom, keccak256, stringToHex, type EIP1193Provider } from "viem";
import type { RecommendationResponse } from "@/lib/schema";

type Risk = "low" | "medium" | "high";
type AssetType = "real_estate" | "art";

const recommendationAbi = [
  {
    type: "function",
    name: "submitRecommendation",
    stateMutability: "nonpayable",
    inputs: [
      { name: "resultHash", type: "bytes32" },
      { name: "tokenIds", type: "uint256[]" },
      { name: "scoresBps", type: "uint16[]" },
      { name: "modelId", type: "string" }
    ],
    outputs: [{ name: "id", type: "uint256" }]
  }
] as const;

const rwa1155Abi = [
  {
    type: "function",
    name: "mintFractional",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" }
    ],
    outputs: []
  }
] as const;

export default function HomePage() {
  const [risk, setRisk] = useState<Risk>("medium");
  const [durationMonths, setDurationMonths] = useState(12);
  const [targetYield, setTargetYield] = useState(10);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>(["real_estate", "art"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [wallet, setWallet] = useState<string>("");
  const [chainStatus, setChainStatus] = useState("Not submitted");
  const [buyStatus, setBuyStatus] = useState("Not purchased");

  const toggleAsset = (value: AssetType) => {
    setAssetTypes((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  const submitPreferences = async () => {
    setLoading(true);
    setChainStatus("Not submitted");
    setBuyStatus("Not purchased");
    try {
      const resp = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ risk, durationMonths, targetYield, assetTypes })
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text);
      }
      const data = (await resp.json()) as RecommendationResponse;
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  const submitOnChain = async () => {
    if (!result) return;
    const recommender = process.env.NEXT_PUBLIC_RECOMMENDER_ADDRESS;
    if (!recommender || recommender === "0x0000000000000000000000000000000000000000") {
      setChainStatus("Submitted (simulated, set NEXT_PUBLIC_RECOMMENDER_ADDRESS for real tx)");
      return;
    }

    try {
      const account = await connectWallet();
      if (!account) {
        setChainStatus("Submitted (simulated, wallet unavailable)");
        return;
      }

      const provider = getProvider();
      if (!provider) {
        setChainStatus("Submitted (simulated, wallet unavailable)");
        return;
      }
      const transport = custom(provider);
      const walletClient = createWalletClient({ transport });

      const tokenIds = result.recommendations.map((x) => BigInt(x.tokenId));
      const scoresBps = result.recommendations.map((x) => Math.round(x.score * 10_000));
      const resultHash = keccak256(stringToHex(JSON.stringify(result)));

      const txHash = await walletClient.writeContract({
        chain: undefined,
        account,
        address: recommender as `0x${string}`,
        abi: recommendationAbi,
        functionName: "submitRecommendation",
        args: [resultHash, tokenIds, scoresBps, result.model]
      });
      setChainStatus(`Submitted: ${txHash}`);
    } catch (err) {
      console.error(err);
      setChainStatus("Submit failed");
    }
  };

  const simulateBuy = async () => {
    if (!result) return;
    const rwa1155 = process.env.NEXT_PUBLIC_RWA1155_ADDRESS;
    if (!rwa1155 || rwa1155 === "0x0000000000000000000000000000000000000000") {
      setBuyStatus("Mint success (simulated, set NEXT_PUBLIC_RWA1155_ADDRESS for real tx)");
      return;
    }

    try {
      const account = await connectWallet();
      if (!account) {
        setBuyStatus("Mint success (simulated, wallet unavailable)");
        return;
      }

      const provider = getProvider();
      if (!provider) {
        setBuyStatus("Mint success (simulated, wallet unavailable)");
        return;
      }
      const transport = custom(provider);
      const walletClient = createWalletClient({ transport });
      const top = result.recommendations[0];
      const txHash = await walletClient.writeContract({
        chain: undefined,
        account,
        address: rwa1155 as `0x${string}`,
        abi: rwa1155Abi,
        functionName: "mintFractional",
        args: [BigInt(top.tokenId), BigInt(top.fractionAmount), account]
      });
      setBuyStatus(`Mint submitted: ${txHash}`);
    } catch (err) {
      console.error(err);
      setBuyStatus("Mint failed");
    }
  };

  const connectWallet = async (): Promise<`0x${string}` | null> => {
    const eth = getProvider();
    if (!eth) return null;

    const accounts = await eth.request({ method: "eth_requestAccounts" });
    const account = accounts?.[0] as `0x${string}` | undefined;
    if (!account) return null;

    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID ?? "80002";
    const hexChainId = `0x${Number(chainId).toString(16)}`;
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }]
      });
    } catch {
      // Keep flow simple for MVP; user may switch manually.
    }
    setWallet(account);
    return account;
  };

  const getProvider = (): EIP1193Provider | null => {
    const eth = (window as Window & { ethereum?: EIP1193Provider }).ethereum;
    return eth ?? null;
  };

  const shortText = (value: string) => (value.length > 26 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value);

  return (
    <main className="page-shell">
      <div className="hero-gradient" />
      <header className="topbar">
        <div>
          <h1>AI RWA Recommendation Engine</h1>
          <p className="sub">Premium AI advisor for fractional real-world assets</p>
        </div>
        <button className="btn ghost" data-testid="connect-btn" onClick={() => void connectWallet()}>
          {wallet ? `Wallet ${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Connect Wallet"}
        </button>
      </header>

      <section className="card elevated">
        <div className="card-title-row">
          <h2>Investor Preferences</h2>
          <span className="pill">Chain: Polygon Amoy</span>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Risk Profile</span>
            <select
              data-testid="risk-select"
              value={risk}
              onChange={(e) => setRisk(e.target.value as Risk)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label className="field">
            <span>Duration (months)</span>
            <input
              data-testid="duration-input"
              type="number"
              value={durationMonths}
              onChange={(e) => setDurationMonths(Number(e.target.value))}
            />
          </label>

          <label className="field">
            <span>Target Yield (%)</span>
            <input
              data-testid="yield-input"
              type="number"
              value={targetYield}
              onChange={(e) => setTargetYield(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="asset-row">
          <label className="checkbox-chip">
            <input
              type="checkbox"
              checked={assetTypes.includes("real_estate")}
              onChange={() => toggleAsset("real_estate")}
            />
            <span>Real Estate</span>
          </label>
          <label className="checkbox-chip">
            <input
              type="checkbox"
              checked={assetTypes.includes("art")}
              onChange={() => toggleAsset("art")}
            />
            <span>Art</span>
          </label>
        </div>

        <button className="btn primary" data-testid="recommend-btn" onClick={submitPreferences} disabled={loading}>
          {loading ? "Generating AI Recommendation..." : "Generate Recommendation"}
        </button>
      </section>

      {result && (
        <section className="card elevated">
          <div className="card-title-row">
            <h2>Recommendation Result</h2>
            <span className="pill" data-testid="model-name">
              {result.model}
            </span>
          </div>

          <div className="recommend-grid">
            {result.recommendations.map((item, i) => (
              <article key={`${item.tokenId}-${i}`} className="rec-card">
                <div className="rec-top">
                  <strong data-testid={`token-${i}`}>Token #{item.tokenId}</strong>
                  <span className="score">Score {item.score.toFixed(2)}</span>
                </div>
                <p className="metric">
                  Yield Range: {item.predictedYieldMin}% - {item.predictedYieldMax}%
                </p>
                <p className="metric">Recommended Amount: {item.fractionAmount}</p>
                <p className="reason">{item.reason}</p>
              </article>
            ))}
          </div>

          <p className="disclaimer">{result.riskDisclosure}</p>

          <div className="action-row">
            <button className="btn primary" data-testid="onchain-btn" onClick={submitOnChain}>
              Submit Summary On-Chain
            </button>
            <button className="btn success" data-testid="buy-btn" onClick={simulateBuy}>
              Execute Mint / Buy
            </button>
          </div>

          <div className="status-grid">
            <div className="status-item">
              <span>On-chain status</span>
              <p data-testid="chain-status">{shortText(chainStatus)}</p>
            </div>
            <div className="status-item">
              <span>Mint status</span>
              <p data-testid="buy-status">{shortText(buyStatus)}</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
