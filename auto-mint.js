/**
 * MakeSTX — Sonsuz Multi-Wallet Auto-Mint
 * ═══════════════════════════════════════════════════════════
 * Ana cüzdana STX gönder → Script bakiye bitene kadar:
 *   Yeni cüzdan üret → STX gönder → Paralel mint at → Tekrar
 *
 * Kurulum:
 *   npm install @stacks/transactions @stacks/wallet-sdk @stacks/network
 *
 * Çalıştır:
 *   MNEMONIC="24 kelime" node auto-mint.js
 *   PRIVATE_KEY="0x..." STX_ADDRESS="SP..." node auto-mint.js
 */

const {
  makeContractCall,
  makeSTXTokenTransfer,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  principalCV,
  getAddressFromPrivateKey,
  TransactionVersion,
} = require("@stacks/transactions");
const { StacksMainnet } = require("@stacks/network");
const crypto = require("crypto");
const fs     = require("fs");

// ─── CONFIG ────────────────────────────────────────────────
const CONFIG = {
  contractAddress: "SP38Q50GFD6PDP895EDB1Z4B64NCG9763QFS663G7", // deploy ettikten sonra güncelle
  contractName:    "makestx-nft",
  functionName:    "mint",

  stxPerWallet:    150_000n,   // 0.15 STX per wallet
  mintsPerWallet:  50,
  parallelWorkers: 5,

  mintFee:     BigInt(2000),
  transferFee: BigInt(1500),

  delayBetweenMints:    300,
  delayFundingConfirm: 12_000,
  retryDelay:           5_000,
  maxRetries:           3,
};

const COST_PER_WALLET =
  CONFIG.stxPerWallet +
  CONFIG.transferFee +
  BigInt(CONFIG.mintsPerWallet) * CONFIG.mintFee;

const network = new StacksMainnet();
const sleep   = (ms) => new Promise(r => setTimeout(r, ms));

function fmt(ms) {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function generatePrivateKey() {
  return crypto.randomBytes(32).toString("hex") + "01";
}

function getAddress(pk) {
  return getAddressFromPrivateKey(pk, TransactionVersion.Mainnet);
}

async function getNonce(address) {
  try {
    const r = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}`);
    return Number((await r.json()).nonce ?? 0);
  } catch { return 0; }
}

async function getBalance(address) {
  try {
    const r = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}`);
    return BigInt((await r.json()).balance ?? "0");
  } catch { return BigInt(0); }
}

async function sendSTX(fromKey, toAddress, amount, nonce) {
  for (let t = 0; t <= CONFIG.maxRetries; t++) {
    try {
      const tx = await makeSTXTokenTransfer({ recipient: toAddress, amount, senderKey: fromKey, network, nonce: BigInt(nonce), anchorMode: AnchorMode.Any, fee: CONFIG.transferFee });
      const res = await broadcastTransaction(tx, network);
      if (res.error) throw new Error(res.error);
      return { ok: true, txid: res.txid };
    } catch (e) {
      if (t < CONFIG.maxRetries) { await sleep(CONFIG.retryDelay); continue; }
      return { ok: false, error: e.message };
    }
  }
}

async function mintTx(fromKey, recipient, nonce) {
  for (let t = 0; t <= CONFIG.maxRetries; t++) {
    try {
      const tx = await makeContractCall({ contractAddress: CONFIG.contractAddress, contractName: CONFIG.contractName, functionName: CONFIG.functionName, functionArgs: [principalCV(recipient)], senderKey: fromKey, network, nonce: BigInt(nonce), anchorMode: AnchorMode.Any, postConditionMode: PostConditionMode.Allow, fee: CONFIG.mintFee });
      const res = await broadcastTransaction(tx, network);
      if (res.error) throw new Error(res.error);
      return { ok: true, txid: res.txid };
    } catch (e) {
      if (t < CONFIG.maxRetries) { await sleep(CONFIG.retryDelay); continue; }
      return { ok: false, error: e.message };
    }
  }
}

async function runWorker(id, pk, addr, stats) {
  const nonce = await getNonce(addr);
  let ok = 0, fail = 0;
  for (let i = 0; i < CONFIG.mintsPerWallet; i++) {
    const r = await mintTx(pk, addr, nonce + i);
    if (r.ok) { ok++; stats.minted++; }
    else       { fail++; stats.failed++; }
    if (i < CONFIG.mintsPerWallet - 1) await sleep(CONFIG.delayBetweenMints);
  }
  console.log(`  [W${id}] ${addr.slice(0, 14)}... → ✅${ok} ❌${fail}`);
}

async function main() {
  console.log("\n" + "═".repeat(56));
  console.log("  🚀  MakeSTX — Multi-Wallet Auto-Mint");
  console.log("═".repeat(56));

  // Master wallet
  let masterKey, masterAddress;
  try {
    const { generateWallet } = require("@stacks/wallet-sdk");
    const mnemonic = process.env.MNEMONIC;
    if (!mnemonic) throw new Error("no mnemonic");
    const w = await generateWallet({ secretKey: mnemonic, password: "" });
    masterKey     = w.accounts[0].stxPrivateKey;
    masterAddress = w.accounts[0].address;
  } catch {
    masterKey     = process.env.PRIVATE_KEY;
    masterAddress = process.env.STX_ADDRESS;
    if (!masterKey || !masterAddress) {
      console.error("❌ MNEMONIC or (PRIVATE_KEY + STX_ADDRESS) required");
      process.exit(1);
    }
  }

  console.log(`\n📍 Master : ${masterAddress}`);
  console.log(`👥 Workers: ${CONFIG.parallelWorkers}`);
  console.log(`🎯 Mints  : ${CONFIG.mintsPerWallet}/wallet`);
  console.log(`💸 Cost   : ~${Number(COST_PER_WALLET)/1e6} STX/wallet`);

  const stats       = { minted: 0, failed: 0, wallets: 0, rounds: 0, start: Date.now() };
  const logFile     = `mint-log-${Date.now()}.jsonl`;
  const allWallets  = [];
  let masterNonce   = await getNonce(masterAddress);
  let round = 0;

  while (true) {
    round++;
    const bal          = await getBalance(masterAddress);
    const affordable   = Number(bal / COST_PER_WALLET);
    const active       = Math.min(CONFIG.parallelWorkers, affordable);

    console.log(`\n${"─".repeat(56)}`);
    console.log(`  ROUND #${round} | BAL: ${Number(bal)/1e6} STX | WORKERS: ${active}`);
    console.log(`${"─".repeat(56)}`);

    if (active === 0) { console.log("\n⛔ Balance depleted. Done."); break; }

    // Generate wallets
    const batch = Array.from({ length: active }, () => {
      const pk   = generatePrivateKey();
      const addr = getAddress(pk);
      return { pk, addr };
    });

    // Fund wallets
    console.log(`\n  📤 Funding ${active} wallets...`);
    const funded = [];
    for (let i = 0; i < batch.length; i++) {
      const r = await sendSTX(masterKey, batch[i].addr, CONFIG.stxPerWallet, masterNonce++);
      if (r.ok) {
        funded.push(batch[i]);
        allWallets.push({ ...batch[i], round });
        stats.wallets++;
        console.log(`  ✅ ${batch[i].addr.slice(0,16)}...`);
      } else {
        console.log(`  ❌ ${r.error}`);
      }
    }

    if (funded.length === 0) { await sleep(10_000); continue; }

    console.log(`\n  ⏳ Waiting ${CONFIG.delayFundingConfirm/1000}s for confirmation...`);
    await sleep(CONFIG.delayFundingConfirm);

    console.log(`\n  🔥 Launching ${funded.length} parallel workers...\n`);
    await Promise.all(funded.map(({ pk, addr }, i) => runWorker(i + 1, pk, addr, stats)));
    stats.rounds++;

    const elapsed = Date.now() - stats.start;
    console.log(`\n  📊 Total: ✅${stats.minted} | ❌${stats.failed} | ⏱ ${fmt(elapsed)} | 📈 ${(stats.minted/(elapsed/1000)).toFixed(2)} tx/s`);
    fs.appendFileSync(logFile, JSON.stringify({ round, minted: stats.minted, ts: new Date().toISOString() }) + "\n");
  }

  const elapsed = Date.now() - stats.start;
  console.log("\n" + "═".repeat(56));
  console.log("  📊  FINAL RESULTS");
  console.log("═".repeat(56));
  console.log(`  ✅ Minted  : ${stats.minted}`);
  console.log(`  ❌ Failed  : ${stats.failed}`);
  console.log(`  👛 Wallets : ${stats.wallets}`);
  console.log(`  🔄 Rounds  : ${stats.rounds}`);
  console.log(`  ⏱  Time    : ${fmt(elapsed)}`);
  console.log(`  📈 Speed   : ${(stats.minted/(elapsed/1000)).toFixed(2)} tx/s`);

  const dump = `wallets-${Date.now()}.json`;
  fs.writeFileSync(dump, JSON.stringify(allWallets, null, 2));
  console.log(`  📁 Log     : ${logFile}`);
  console.log(`  🔑 Wallets : ${dump}`);
  console.log("═".repeat(56) + "\n");
}

main().catch(e => { console.error("💥", e); process.exit(1); });
