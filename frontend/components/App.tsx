"use client";
// Patron — standalone creator-membership / tipping dApp. Warm, playful template. Self-contained.
import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";

const C = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0") as `0x${string}`;
const CHAIN = 5042002, HEX = "0x4CEF52";
const ABI = [
  { name: "create", type: "function", stateMutability: "nonpayable", inputs: [{ name: "label", type: "string" }, { name: "price", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { name: "pay", type: "function", stateMutability: "payable", inputs: [{ name: "id", type: "uint256" }], outputs: [] },
  { name: "get", type: "function", stateMutability: "view", inputs: [{ name: "id", type: "uint256" }], outputs: [{ type: "tuple", components: [{ name: "owner", type: "address" }, { name: "label", type: "string" }, { name: "price", type: "uint256" }, { name: "paid", type: "bool" }, { name: "payer", type: "address" }, { name: "at", type: "uint256" }] }] },
  { name: "total", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "earnApyBps", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "earnDeposit", type: "function", stateMutability: "payable", inputs: [], outputs: [] },
  { name: "earnWithdraw", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "earnPrincipal", type: "function", stateMutability: "view", inputs: [{ name: "u", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "earnBalanceOf", type: "function", stateMutability: "view", inputs: [{ name: "u", type: "address" }], outputs: [{ type: "uint256" }] },
] as const;
const m = (w?: bigint, d = 2) => w === undefined ? "0.00" : Number(formatEther(w)).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const cut = (a?: string) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
async function toArc() { const e = (window as any).ethereum; if (!e) return; try { await e.request({ method: "wallet_addEthereumChain", params: [{ chainId: HEX, chainName: "Arc Testnet", nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 }, rpcUrls: ["https://rpc.testnet.arc.network"], blockExplorerUrls: ["https://testnet.arcscan.app"] }] }); } catch { try { await e.request({ method: "wallet_switchEthereumChain", params: [{ chainId: HEX }] }); } catch {} } }

export default function App() {
  const { address, isConnected } = useAccount();
  const net = useChainId();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [pop, setPop] = useState(false);
  const [tab, setTab] = useState<"tiers" | "earn">("tiers");
  const [nf, setNf] = useState({ label: "", price: "" });
  const [dep, setDep] = useState("");
  const w = useWriteContract();
  const rc = useWaitForTransactionReceipt({ hash: w.data, query: { enabled: !!w.data } });
  const busy = w.isPending || rc.isLoading;
  useEffect(() => { if (rc.isSuccess) { w.reset(); setNf({ label: "", price: "" }); setDep(""); } }, [rc.isSuccess]); // eslint-disable-line
  const total = useReadContract({ address: C, abi: ABI, functionName: "total" });
  const apy = useReadContract({ address: C, abi: ABI, functionName: "earnApyBps" });
  const prin = useReadContract({ address: C, abi: ABI, functionName: "earnPrincipal", args: address ? [address] : undefined, query: { enabled: !!address } });
  const bal = useReadContract({ address: C, abi: ABI, functionName: "earnBalanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });
  const n = total.data !== undefined ? Number(total.data) : 0;
  const wrong = isConnected && net !== CHAIN;
  const apyPct = apy.data === undefined ? "—" : (Number(apy.data) / 100).toFixed(1);
  const call = (fn: string, a: any[], v?: bigint) => w.writeContract({ address: C, abi: ABI, functionName: fn as any, args: a, value: v });

  return (
    <div style={{ minHeight: "100vh", background: "#fff6f4", color: "#3b1f29", fontFamily: '"Quicksand","Segoe UI",sans-serif' }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 7vw" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}><span style={{ fontSize: 26 }}>🎭</span><b style={{ fontSize: 21, fontWeight: 700 }}>Patron</b></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {wrong && <button onClick={toArc} style={{ background: "#e11d48", color: "#fff", border: 0, padding: "8px 13px", borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Switch to Arc</button>}
          <div style={{ position: "relative" }}>
            <button onClick={() => setPop(p => !p)} style={{ background: "#e84a7f", color: "#fff", border: 0, padding: "10px 20px", borderRadius: 999, fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 6px 16px rgba(232,74,127,.3)" }}>{isConnected ? `${cut(address)} ▾` : "Connect 💖"}</button>
            {pop && <div style={{ position: "absolute", right: 0, top: "115%", background: "#fff", border: "2px solid #ffd9e2", borderRadius: 16, padding: 8, minWidth: 200, zIndex: 20, boxShadow: "0 14px 36px rgba(232,74,127,.18)" }}>
              {isConnected ? <button onClick={() => { disconnect(); setPop(false); }} style={pill("#e11d48")}>Disconnect</button> : connectors.map(c => <button key={c.uid} onClick={() => { connect({ connector: c }); setPop(false); }} style={pill("#3b1f29")}>{c.name}</button>)}
            </div>}
          </div>
        </div>
      </header>

      <section style={{ textAlign: "center", padding: "40px 7vw 26px" }}>
        <h1 style={{ fontSize: 46, fontWeight: 800, margin: 0, lineHeight: 1.05 }}>Support the<br />creators you love 💖</h1>
        <p style={{ color: "#9c6b7b", marginTop: 14, fontSize: 17 }}>Set membership tiers, get backed in USDC, grow your tips in a vault.</p>
        <div style={{ display: "inline-flex", background: "#ffe4ec", borderRadius: 999, padding: 5, marginTop: 22, gap: 4 }}>
          {(["tiers", "earn"] as const).map(k => <button key={k} onClick={() => setTab(k)} style={{ padding: "9px 26px", borderRadius: 999, border: 0, fontWeight: 700, fontSize: 14, cursor: "pointer", background: tab === k ? "#e84a7f" : "transparent", color: tab === k ? "#fff" : "#b06a82" }}>{k === "tiers" ? "Tiers" : `Vault ${apyPct}%`}</button>)}
        </div>
      </section>

      <main style={{ padding: "4px 7vw 70px", maxWidth: 620, margin: "0 auto" }}>
        {tab === "tiers" && <div style={{ display: "grid", gap: 16 }}>
          <div style={card}>
            <div style={ttl}>Create a membership tier</div>
            <input value={nf.label} onChange={e => setNf(v => ({ ...v, label: e.target.value }))} placeholder="Tier name (e.g. Gold supporter)" style={inp} />
            <input value={nf.price} onChange={e => setNf(v => ({ ...v, price: e.target.value }))} type="number" placeholder="Price USDC" style={inp} />
            <button disabled={!isConnected || busy || !nf.label || !(Number(nf.price) > 0)} onClick={() => call("create", [nf.label, parseEther(nf.price || "0")])} style={cta(busy)}>{busy ? "…" : "Create tier 🎭"}</button>
          </div>
          {n === 0 && <div style={{ ...card, textAlign: "center", color: "#c08fa0" }}>No tiers yet — create the first 💝</div>}
          {Array.from({ length: n }, (_, i) => BigInt(n - 1 - i)).map(id => <Tier key={id.toString()} id={id} busy={busy} onPay={(p) => call("pay", [id], p)} />)}
        </div>}
        {tab === "earn" && <div style={card}>
          <div style={ttl}>Grow your tips · {apyPct}% APY</div>
          <div style={{ display: "flex", gap: 16, color: "#9c6b7b", fontSize: 14, margin: "2px 0 14px" }}><span>Principal <b style={{ color: "#e84a7f" }}>${m(prin.data as bigint)}</b></span><span>Balance <b style={{ color: "#e84a7f" }}>${m(bal.data as bigint)}</b></span></div>
          <input value={dep} onChange={e => setDep(e.target.value)} type="number" placeholder="USDC to deposit" style={inp} />
          <div style={{ display: "flex", gap: 10 }}>
            <button disabled={!isConnected || busy || !(Number(dep) > 0)} onClick={() => call("earnDeposit", [], parseEther(dep || "0"))} style={cta(busy)}>{busy ? "…" : "Deposit"}</button>
            <button disabled={busy || !(prin.data && (prin.data as bigint) > 0n)} onClick={() => call("earnWithdraw", [])} style={{ ...cta(busy), background: "#fff", color: "#e84a7f", border: "2px solid #e84a7f" }}>Withdraw</button>
          </div>
        </div>}
      </main>
      <footer style={{ textAlign: "center", padding: "20px", color: "#c9a3b0", fontSize: 13 }}>Built on <a href="https://arc.network" target="_blank" rel="noopener noreferrer" style={{ color: "#e84a7f", textDecoration: "none", fontWeight: 700 }}>Arc Network</a></footer>
    </div>
  );
}
function Tier({ id, busy, onPay }: { id: bigint; busy: boolean; onPay: (p: bigint) => void }) {
  const g = useReadContract({ address: C, abi: ABI, functionName: "get", args: [id] });
  if (!g.data) return null;
  const it = g.data as any;
  return (
    <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div><div style={{ fontWeight: 800, fontSize: 17 }}>{it.label || `Tier #${id}`}</div><div style={{ color: "#c08fa0", fontSize: 13, marginTop: 2 }}>by {cut(it.owner)}</div></div>
      <button disabled={busy} onClick={() => onPay(it.price as bigint)} style={{ ...cta(busy), width: "auto", padding: "11px 24px", marginTop: 0 }}>{busy ? "…" : `Back · $${m(it.price)}`}</button>
    </div>
  );
}
const card: React.CSSProperties = { background: "#fff", border: "2px solid #ffe4ec", borderRadius: 22, padding: "20px 22px", boxShadow: "0 8px 26px rgba(232,74,127,.07)" };
const ttl: React.CSSProperties = { fontWeight: 800, fontSize: 18, marginBottom: 12 };
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "#fff6f4", border: "2px solid #ffd9e2", borderRadius: 14, padding: "12px 15px", fontSize: 15, marginBottom: 10, outline: "none", color: "#3b1f29" };
const cta = (d?: boolean): React.CSSProperties => ({ width: "100%", marginTop: 4, background: "#e84a7f", color: "#fff", border: 0, borderRadius: 14, padding: "13px 0", fontSize: 15, fontWeight: 800, cursor: d ? "not-allowed" : "pointer", opacity: d ? .55 : 1 });
const pill = (color: string): React.CSSProperties => ({ display: "block", width: "100%", textAlign: "left", background: "none", border: 0, padding: "9px 12px", borderRadius: 10, color, fontWeight: 700, fontSize: 14, cursor: "pointer" });
