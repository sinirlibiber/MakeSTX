import Head from 'next/head';
import { useState, useRef } from 'react';
import {
  makeContractCall,
  makeSTXTokenTransfer,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  principalCV,
  getAddressFromPrivateKey,
  TransactionVersion,
} from '@stacks/transactions';
import { generateWallet, getStxAddress } from '@stacks/wallet-sdk';
import { network, CONTRACT_ADDRESS, CONTRACT_NAME } from '@/hooks/useWallet';
import Navbar from '@/components/Navbar';
import { Zap, Wallet, Play, Square, AlertTriangle, CheckCircle2, XCircle, Info, Activity } from 'lucide-react';

interface LogEntry { time: string; msg: string; type: 'ok' | 'err' | 'info'; }
interface Stats    { totalMinted: number; totalFailed: number; totalWallets: number; rounds: number; }

const MINT_FEE     = BigInt(2000);
const TRANSFER_FEE = BigInt(1500);
const FUNDING_WAIT = 12_000;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function generatePrivateKey() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('') + '01';
}

function getSubAddress(pk: string) {
  return getAddressFromPrivateKey(pk, TransactionVersion.Mainnet);
}

export default function MultiMint() {
  const [mnemonic, setMnemonic]           = useState('');
  const [stxPerWallet, setStxPerWallet]   = useState(0.15);
  const [mintsPerWallet, setMintsPerWallet] = useState(50);
  const [parallelWorkers, setParallelWorkers] = useState(5);
  const [running, setRunning]             = useState(false);
  const [logs, setLogs]                   = useState<LogEntry[]>([]);
  const [stats, setStats]                 = useState<Stats>({ totalMinted: 0, totalFailed: 0, totalWallets: 0, rounds: 0 });
  const [balance, setBalance]             = useState<number | null>(null);
  const [phase, setPhase]                 = useState<'idle' | 'funding' | 'minting' | 'done'>('idle');
  const [round, setRound]                 = useState(0);
  const stopFlag = useRef(false);
  const statsRef = useRef<Stats>({ totalMinted: 0, totalFailed: 0, totalWallets: 0, rounds: 0 });
  const logRef   = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('tr-TR');
    setLogs(prev => [...prev, { time, msg, type }].slice(-400));
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 10);
  };

  const getNonce = async (addr: string) => {
    try {
      const r = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${addr}?unanchored=true`);
      return parseInt((await r.json()).nonce);
    } catch { return 0; }
  };

  const getBalanceMicro = async (addr: string): Promise<bigint> => {
    try {
      const r = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${addr}?unanchored=true`);
      return BigInt((await r.json()).balance ?? '0');
    } catch { return BigInt(0); }
  };

  const sendSTX = async (fromKey: string, to: string, amount: bigint, nonce: number) => {
    for (let t = 0; t <= 3; t++) {
      try {
        const tx = await makeSTXTokenTransfer({ recipient: to, amount, senderKey: fromKey, network, nonce: BigInt(nonce), anchorMode: AnchorMode.Any, fee: TRANSFER_FEE });
        const res = await broadcastTransaction(tx, network);
        if (res.error) throw new Error(res.error);
        return { ok: true, txid: res.txid };
      } catch (e: any) {
        if (t < 3) { await sleep(3000); continue; }
        return { ok: false, error: e.message };
      }
    }
    return { ok: false, error: 'max retries' };
  };

  const mintOne = async (fromKey: string, toAddr: string, nonce: number) => {
    for (let t = 0; t <= 3; t++) {
      try {
        const tx = await makeContractCall({ contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME, functionName: 'mint', functionArgs: [principalCV(toAddr)], senderKey: fromKey, network, nonce: BigInt(nonce), anchorMode: AnchorMode.Any, postConditionMode: PostConditionMode.Allow, fee: MINT_FEE });
        const res = await broadcastTransaction(tx, network);
        if (res.error) throw new Error(res.error);
        return { ok: true, txid: res.txid };
      } catch (e: any) {
        if (t < 3) { await sleep(3000); continue; }
        return { ok: false, error: e.message };
      }
    }
    return { ok: false, error: 'max retries' };
  };

  const runWorker = async (id: number, pk: string, addr: string) => {
    let nonce = await getNonce(addr);
    let ok = 0, fail = 0;
    for (let i = 0; i < mintsPerWallet; i++) {
      if (stopFlag.current) break;
      const r = await mintOne(pk, addr, nonce + i);
      if (r.ok) { ok++; statsRef.current.totalMinted++; addLog(`[W${id}] TX_${i+1} ✓ ${r.txid?.slice(0,16)}...`, 'ok'); }
      else       { fail++; statsRef.current.totalFailed++; addLog(`[W${id}] TX_${i+1} ✗ ${r.error}`, 'err'); }
      setStats({ ...statsRef.current });
      if (i < mintsPerWallet - 1 && !stopFlag.current) await sleep(300);
    }
    addLog(`[W${id}] DONE → OK:${ok} FAIL:${fail}`, ok > 0 ? 'ok' : 'err');
  };

  const startMultiMint = async () => {
    if (running) return;
    if (!mnemonic.trim()) { addLog('ERROR: Seed phrase empty', 'err'); return; }

    stopFlag.current = false;
    setRunning(true);
    setLogs([]);
    statsRef.current = { totalMinted: 0, totalFailed: 0, totalWallets: 0, rounds: 0 };
    setStats({ ...statsRef.current });
    setPhase('idle'); setRound(0);

    let masterKey: string, masterAddress: string;
    try {
      const wallet = await generateWallet({ secretKey: mnemonic.trim(), password: '' });
      const acc    = wallet.accounts[0];
      masterKey    = acc.stxPrivateKey;
      masterAddress = getStxAddress({ account: acc, transactionVersion: TransactionVersion.Mainnet });
      addLog(`MASTER: ${masterAddress}`, 'ok');
    } catch (e: any) {
      addLog('ERR: ' + e.message, 'err');
      setRunning(false); return;
    }

    const stxMicro    = BigInt(Math.round(stxPerWallet * 1_000_000));
    const costPerWallet = stxMicro + TRANSFER_FEE + BigInt(mintsPerWallet) * MINT_FEE;

    const bal = await getBalanceMicro(masterAddress);
    setBalance(Number(bal) / 1_000_000);
    addLog(`BALANCE: ${Number(bal) / 1_000_000} STX`, 'info');
    addLog(`COST_PER_WALLET: ${Number(costPerWallet) / 1_000_000} STX`, 'info');

    if (bal < costPerWallet) {
      addLog(`INSUFFICIENT BALANCE — need ${Number(costPerWallet) / 1_000_000} STX`, 'err');
      setRunning(false); return;
    }

    let masterNonce = await getNonce(masterAddress);
    let roundNum = 0;

    while (!stopFlag.current) {
      roundNum++;
      setRound(roundNum);
      const curBal   = await getBalanceMicro(masterAddress);
      setBalance(Number(curBal) / 1_000_000);
      const affordable   = Number(curBal / costPerWallet);
      const activeWorkers = Math.min(parallelWorkers, affordable);

      addLog(`\n=== ROUND_${roundNum} | BAL: ${Number(curBal)/1e6} STX | WORKERS: ${activeWorkers} ===`, 'info');

      if (activeWorkers === 0) { addLog('BALANCE_DEPLETED — process complete', 'info'); break; }

      const batch = Array.from({ length: activeWorkers }, () => {
        const pk   = generatePrivateKey();
        const addr = getSubAddress(pk);
        return { pk, addr };
      });

      setPhase('funding');
      addLog(`FUNDING ${activeWorkers} wallets...`, 'info');
      const funded: typeof batch = [];

      for (let i = 0; i < batch.length; i++) {
        if (stopFlag.current) break;
        const { pk, addr } = batch[i];
        const r = await sendSTX(masterKey, addr, stxMicro, masterNonce++);
        if (r.ok) {
          funded.push({ pk, addr });
          statsRef.current.totalWallets++;
          addLog(`FUNDED_${i+1}: ${addr.slice(0,16)}... ✓`, 'ok');
        } else {
          addLog(`FUND_FAIL_${i+1}: ${r.error}`, 'err');
        }
      }

      if (funded.length === 0) { await sleep(10_000); continue; }

      addLog(`WAITING ${FUNDING_WAIT/1000}s for confirmation...`, 'info');
      await sleep(FUNDING_WAIT);

      setPhase('minting');
      addLog(`LAUNCHING ${funded.length} parallel workers...`, 'info');
      await Promise.all(funded.map(({ pk, addr }, i) => runWorker(i + 1, pk, addr)));

      statsRef.current.rounds++;
      setStats({ ...statsRef.current });
      if (stopFlag.current) break;
    }

    setPhase('done');
    setRunning(false);
    addLog(`\n=== COMPLETE | MINTED: ${statsRef.current.totalMinted} | WALLETS: ${statsRef.current.totalWallets} ===`, 'ok');
  };

  const costPerWallet = (stxPerWallet + (Number(TRANSFER_FEE) + mintsPerWallet * Number(MINT_FEE)) / 1_000_000).toFixed(4);
  const estimatedMints = balance ? Math.floor(balance / parseFloat(costPerWallet)) * mintsPerWallet : 0;

  return (
    <>
      <Head><title>Multi Mint — MakeSTX</title></Head>
      <div className="min-h-screen bg-ms-bg grid-bg">
        <Navbar />

        <main className="pt-28 pb-16 px-4 max-w-2xl mx-auto">

          {/* Header */}
          <div className="mb-8 flex items-start gap-4">
            <div className="w-12 h-12 border border-ms-magenta flex items-center justify-center shrink-0"
                 style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }}>
              <Zap size={20} className="text-ms-magenta" />
            </div>
            <div>
              <p className="font-mono text-xs text-ms-muted tracking-widest mb-1">// multi_wallet_mint.js</p>
              <h1 className="font-display font-black text-3xl text-ms-text tracking-tight">
                MULTI <span className="text-ms-magenta">MINT</span>
              </h1>
              <p className="font-mono text-xs text-ms-muted mt-1">
                MASTER WALLET → GENERATE WALLETS → FUND → PARALLEL MINT
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-2 p-3 mb-5 bg-yellow-500/5 border border-yellow-500/30">
            <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-xs font-mono text-yellow-400/80">
              SEED PHRASE PROCESSED LOCALLY ONLY. USE A DEDICATED WALLET WITH ENOUGH STX.
            </p>
          </div>

          {/* Seed phrase */}
          <div className="card-dark p-4 mb-3">
            <label className="block text-xs font-mono text-ms-muted tracking-widest mb-2 flex items-center gap-1.5">
              <Wallet size={11} /> // MASTER_WALLET SEED (12 OR 24 WORDS)
            </label>
            <input
              type="password"
              value={mnemonic}
              onChange={e => setMnemonic(e.target.value)}
              placeholder="word1 word2 word3 ..."
              disabled={running}
              className="w-full bg-ms-bg border border-ms-border px-3 py-2 text-xs font-mono text-ms-text placeholder-ms-muted focus:outline-none focus:border-ms-cyan disabled:opacity-40 tracking-wider"
            />
          </div>

          {/* Config */}
          <div className="card-dark p-4 mb-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'STX_PER_WALLET', val: stxPerWallet, set: setStxPerWallet, step: 0.05, min: 0.05 },
                { label: 'MINTS_PER_WALLET', val: mintsPerWallet, set: setMintsPerWallet, step: 1, min: 1 },
                { label: 'PARALLEL_WORKERS', val: parallelWorkers, set: setParallelWorkers, step: 1, min: 1 },
              ].map(({ label, val, set, step, min }) => (
                <div key={label}>
                  <label className="block text-xs font-mono text-ms-muted tracking-wider mb-2">{label}</label>
                  <input type="number" value={val}
                    onChange={e => (set as any)(parseFloat(e.target.value))}
                    step={step} min={min} disabled={running}
                    className="w-full bg-ms-bg border border-ms-border px-3 py-2 text-xs font-mono text-ms-text focus:outline-none focus:border-ms-cyan disabled:opacity-40"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-ms-border flex items-center justify-between font-mono text-xs text-ms-muted">
              <span><Info size={10} className="inline mr-1" />COST/WALLET: <span className="text-ms-cyan">{costPerWallet} STX</span></span>
              {balance !== null && (
                <span>EST TOTAL: <span className="text-ms-magenta font-bold">{estimatedMints.toLocaleString()} MINTS</span></span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'MINTED', val: stats.totalMinted, color: 'text-green-400', icon: <CheckCircle2 size={11}/> },
              { label: 'FAILED', val: stats.totalFailed, color: 'text-red-400',   icon: <XCircle size={11}/> },
              { label: 'WALLETS', val: stats.totalWallets, color: 'text-ms-cyan', icon: <Wallet size={11}/> },
              { label: 'ROUNDS', val: round,               color: 'text-ms-magenta', icon: <Zap size={11}/> },
            ].map(({ label, val, color, icon }) => (
              <div key={label} className="card-dark p-3">
                <div className={`flex items-center gap-1 ${color} mb-1`}>{icon}<span className="font-mono text-xs text-ms-muted">{label}</span></div>
                <div className={`text-xl font-display font-bold ${color}`}>{val}</div>
              </div>
            ))}
          </div>

          {/* Phase indicator */}
          {running && (
            <div className="mb-3 p-3 border border-ms-border bg-ms-surface flex items-center gap-3">
              <div className="w-2 h-2 bg-ms-cyan animate-pulse" />
              <span className="font-mono text-xs text-ms-muted tracking-wider">
                {phase === 'funding' && `FUNDING WALLETS... (ROUND ${round})`}
                {phase === 'minting' && `ROUND_${round} — PARALLEL MINT ACTIVE`}
              </span>
              {balance !== null && (
                <span className="ml-auto font-mono text-xs text-ms-muted">BAL: {balance.toFixed(4)} STX</span>
              )}
            </div>
          )}

          {/* Terminal log */}
          <div
            ref={logRef}
            className="h-56 overflow-y-auto bg-ms-bg border border-ms-border p-3 font-mono text-xs mb-4"
            style={{ fontFamily: "'Share Tech Mono', monospace" }}
          >
            <div className="text-ms-muted mb-1">MakeSTX Multi-Wallet Mint Terminal v1.0</div>
            <div className="text-ms-muted mb-2 border-b border-ms-border pb-2">
              {'>'} CONFIG: {parallelWorkers} workers × {mintsPerWallet} mints = {parallelWorkers * mintsPerWallet} tx/round
            </div>
            {logs.length === 0 && <div className="text-ms-muted">{'>'} Awaiting start...</div>}
            {logs.map((l, i) => (
              <div key={i} className={l.type === 'ok' ? 'text-green-400' : l.type === 'err' ? 'text-red-400' : 'text-ms-muted'}>
                <span className="text-ms-border">[{l.time}]</span> {l.msg}
              </div>
            ))}
            {running && <div className="text-ms-cyan animate-pulse mt-1">▋</div>}
          </div>

          {/* Button */}
          {!running ? (
            <button onClick={startMultiMint}
              className="btn-magenta w-full py-5 text-xs flex items-center justify-center gap-2 font-display tracking-widest">
              <Zap size={16} />
              START MULTI-WALLET MINT
            </button>
          ) : (
            <button onClick={() => { stopFlag.current = true; }}
              className="w-full py-5 border border-red-500 text-red-400 font-mono text-xs tracking-widest hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
              <Square size={12} fill="currentColor" />
              TERMINATE ALL WORKERS
            </button>
          )}

          {phase === 'done' && (
            <div className="mt-3 p-3 border border-green-500/30 bg-green-500/5 text-green-400 font-mono text-xs text-center tracking-widest">
              ✓ PROCESS COMPLETE · {stats.totalMinted} MINTED · {stats.totalWallets} WALLETS USED
            </div>
          )}
        </main>
      </div>
    </>
  );
}
