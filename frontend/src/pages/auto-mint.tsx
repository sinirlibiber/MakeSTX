import Head from 'next/head';
import { useState, useRef } from 'react';
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  principalCV,
} from '@stacks/transactions';
import { generateWallet, getStxAddress } from '@stacks/wallet-sdk';
import { TransactionVersion } from '@stacks/transactions';
import { network, CONTRACT_ADDRESS, CONTRACT_NAME } from '@/hooks/useWallet';
import Navbar from '@/components/Navbar';
import { Terminal, Play, Square, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface LogEntry {
  time: string;
  msg: string;
  type: 'ok' | 'err' | 'info';
}

export default function AutoMint() {
  const [mnemonic, setMnemonic]   = useState('');
  const [totalTx, setTotalTx]     = useState(100);
  const [delay, setDelay]         = useState(200);
  const [recipient, setRecipient] = useState('');
  const [running, setRunning]     = useState(false);
  const [logs, setLogs]           = useState<LogEntry[]>([]);
  const [sent, setSent]           = useState(0);
  const [ok, setOk]               = useState(0);
  const [err, setErr]             = useState(0);
  const [eta, setEta]             = useState('—');
  const [progress, setProgress]   = useState(0);
  const stopFlag = useRef(false);
  const logRef   = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('tr-TR');
    setLogs(prev => [...prev, { time, msg, type }].slice(-300));
    setTimeout(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, 10);
  };

  const fmtETA = (ms: number) => {
    if (!ms || ms < 0) return '—';
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const getNonce = async (address: string) => {
    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}?unanchored=true`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return parseInt((await res.json()).nonce);
  };

  const deriveAccount = async (mn: string) => {
    const words = mn.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) throw new Error('12 or 24 words required');
    const wallet = await generateWallet({ secretKey: mn.trim(), password: '' });
    const account = wallet.accounts[0];
    return {
      privateKey: account.stxPrivateKey,
      address: getStxAddress({ account, transactionVersion: TransactionVersion.Mainnet }),
    };
  };

  const mintOne = async (privateKey: string, to: string, nonce: number) => {
    const tx = await makeContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName:    CONTRACT_NAME,
      functionName:    'mint',
      functionArgs:    [principalCV(to)],
      senderKey: privateKey,
      network,
      nonce: BigInt(nonce),
      anchorMode:        AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee: BigInt(2000),
    });
    const result = await broadcastTransaction(tx, network);
    if (result.error) throw new Error(result.error + (result.reason ? ` (${result.reason})` : ''));
    return result.txid;
  };

  const startMint = async () => {
    if (running) return;
    if (!mnemonic.trim()) { addLog('ERROR: Seed phrase is empty', 'err'); return; }

    stopFlag.current = false;
    setRunning(true);
    setLogs([]);
    setSent(0); setOk(0); setErr(0); setProgress(0); setEta('—');

    let privateKey: string, address: string;
    try {
      ({ privateKey, address } = await deriveAccount(mnemonic));
      addLog(`WALLET: ${address}`, 'ok');
    } catch (e: any) {
      addLog('ERR: ' + e.message, 'err');
      setRunning(false); return;
    }

    const to = recipient.trim() || address;
    addLog(`RECIPIENT: ${to}`, 'info');

    let nonce: number;
    try {
      nonce = await getNonce(address);
      addLog(`NONCE: ${nonce} | TOTAL TX: ${totalTx}`, 'info');
    } catch (e: any) {
      addLog('NONCE_ERR: ' + e.message, 'err');
      setRunning(false); return;
    }

    let okCount = 0, errCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < totalTx; i++) {
      if (stopFlag.current) { addLog('// PROCESS TERMINATED BY USER', 'info'); break; }

      try {
        const txid = await mintOne(privateKey, to, nonce + i);
        okCount++;
        addLog(`TX_${String(i + 1).padStart(4,'0')} SUCCESS · ${txid.slice(0, 20)}...`, 'ok');
      } catch (e: any) {
        errCount++;
        addLog(`TX_${String(i + 1).padStart(4,'0')} FAILED  · ${e.message}`, 'err');
      }

      const s       = i + 1;
      const elapsed = Date.now() - startTime;
      const etaMs   = (elapsed / s) * (totalTx - s);
      setSent(s); setOk(okCount); setErr(errCount);
      setProgress(Math.round((s / totalTx) * 100));
      setEta(fmtETA(etaMs));

      if (i < totalTx - 1 && !stopFlag.current) await sleep(delay);
    }

    const total = Date.now() - startTime;
    addLog(`// COMPLETE · ${okCount} OK · ${errCount} FAILED · ${fmtETA(total)}`, okCount > 0 ? 'ok' : 'err');
    setRunning(false);
  };

  return (
    <>
      <Head>
        <title>Auto Mint — MakeSTX</title>
      </Head>
      <div className="min-h-screen bg-ms-bg grid-bg">
        <Navbar />

        <main className="pt-28 pb-16 px-4 max-w-xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <p className="font-mono text-xs text-ms-muted tracking-widest mb-1">// auto_mint_v1.js</p>
            <h1 className="font-display font-black text-3xl text-ms-text tracking-tight">
              AUTO <span className="text-ms-cyan">MINT</span>
            </h1>
            <p className="font-mono text-xs text-ms-muted mt-1">
              {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-6)}.{CONTRACT_NAME}
            </p>
          </div>

          {/* Warning */}
          <div className="flex gap-2 p-3 mb-5 bg-yellow-500/5 border border-yellow-500/30">
            <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-xs font-mono text-yellow-400/80">
              SEED PHRASE NEVER LEAVES YOUR BROWSER. USE A DEDICATED MINT WALLET.
            </p>
          </div>

          {/* Seed phrase */}
          <div className="card-dark p-4 mb-3">
            <label className="block text-xs font-mono text-ms-muted tracking-widest mb-2">
              // SEED_PHRASE (12 OR 24 WORDS)
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
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-mono text-ms-muted tracking-widest mb-2">TOTAL_TX</label>
                <input type="number" value={totalTx} onChange={e => setTotalTx(parseInt(e.target.value))}
                  min={1} max={10000} disabled={running}
                  className="w-full bg-ms-bg border border-ms-border px-3 py-2 text-xs font-mono text-ms-text focus:outline-none focus:border-ms-cyan disabled:opacity-40" />
              </div>
              <div>
                <label className="block text-xs font-mono text-ms-muted tracking-widest mb-2">DELAY_MS</label>
                <input type="number" value={delay} onChange={e => setDelay(parseInt(e.target.value))}
                  min={50} disabled={running}
                  className="w-full bg-ms-bg border border-ms-border px-3 py-2 text-xs font-mono text-ms-text focus:outline-none focus:border-ms-cyan disabled:opacity-40" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-ms-muted tracking-widest mb-2">RECIPIENT (OPTIONAL)</label>
              <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)}
                placeholder="SP... (default: sender)" disabled={running}
                className="w-full bg-ms-bg border border-ms-border px-3 py-2 text-xs font-mono text-ms-text placeholder-ms-muted focus:outline-none focus:border-ms-cyan disabled:opacity-40" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'SENT', value: sent, icon: <Clock size={11} />, color: 'text-ms-cyan' },
              { label: 'OK',   value: ok,   icon: <CheckCircle2 size={11} />, color: 'text-green-400' },
              { label: 'FAIL', value: err,  icon: <XCircle size={11} />,    color: 'text-red-400' },
              { label: 'ETA',  value: eta,  icon: <Terminal size={11} />,   color: 'text-ms-muted' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="card-dark p-3">
                <div className={`flex items-center gap-1 ${color} mb-1`}>{icon}<span className="font-mono text-xs text-ms-muted">{label}</span></div>
                <div className={`text-lg font-display font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="h-px bg-ms-surface overflow-hidden mb-1">
              <div
                className="h-full bg-ms-cyan transition-all duration-200"
                style={{ width: `${progress}%`, boxShadow: '0 0 8px #00f5ff' }}
              />
            </div>
            <div className="flex items-center justify-between font-mono text-xs text-ms-muted">
              <span>{sent} / {totalTx} TX</span>
              <span>{progress}%</span>
            </div>
          </div>

          {/* Log terminal */}
          <div
            ref={logRef}
            className="h-52 overflow-y-auto bg-ms-bg border border-ms-border p-3 font-mono text-xs mb-4"
            style={{ fontFamily: "'Share Tech Mono', monospace" }}
          >
            <div className="text-ms-muted mb-2">MakeSTX Auto-Mint Terminal v1.0</div>
            <div className="text-ms-muted mb-2 border-b border-ms-border pb-2">{'>'} Awaiting input...</div>
            {logs.map((l, i) => (
              <div key={i} className={
                l.type === 'ok'  ? 'text-green-400' :
                l.type === 'err' ? 'text-red-400' :
                'text-ms-muted'
              }>
                <span className="text-ms-border">[{l.time}]</span> {l.msg}
              </div>
            ))}
            {running && <div className="text-ms-cyan animate-pulse mt-1">▋</div>}
          </div>

          {/* Button */}
          {!running ? (
            <button onClick={startMint} className="btn-primary w-full py-4 text-sm flex items-center justify-center gap-2">
              <Play size={14} />
              <span>START AUTO MINT</span>
            </button>
          ) : (
            <button
              onClick={() => { stopFlag.current = true; }}
              className="w-full py-4 border border-red-500 text-red-400 font-mono text-xs tracking-widest hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
            >
              <Square size={12} fill="currentColor" />
              TERMINATE PROCESS
            </button>
          )}
        </main>
      </div>
    </>
  );
}
