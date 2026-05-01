import { useLocation, Link } from 'react-router-dom';
import { Wallet, Send, PieChart, ShieldAlert, TrendingUp, History, ShieldCheck } from 'lucide-react';

const Dashboard = () => {
  const location = useLocation();
  const isDuress = location.state?.duress === true;

  const realBalance = "1,240.50";
  const decoyBalance = "0.00";
  const balance = isDuress ? decoyBalance : realBalance;

  return (
    <div className="min-h-screen bg-background text-text font-sans relative overflow-hidden">
      <div className="hero-bg-grid opacity-10" />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-20 border-r border-neon/10 flex flex-col items-center py-8 gap-12 bg-background2/50 backdrop-blur-md z-20">
        <div className="w-10 h-10 border border-neon/30 flex items-center justify-center text-neon font-display font-bold text-xl">V</div>
        <div className="flex flex-col gap-8 text-muted">
          <Wallet className="w-6 h-6 text-neon" />
          <Send className="w-6 h-6 hover:text-neon transition-colors cursor-pointer" />
          <PieChart className="w-6 h-6 hover:text-neon transition-colors cursor-pointer" />
          <History className="w-6 h-6 hover:text-neon transition-colors cursor-pointer" />
        </div>
        <Link to="/" className="mt-auto font-mono text-[10px] -rotate-90 text-muted hover:text-neon transition-colors uppercase tracking-widest">Logout</Link>
      </div>

      {/* Main Content */}
      <main className="ml-20 p-12 relative z-10 max-w-7xl">
        <header className="flex justify-between items-center mb-16">
          <div className="reveal visible">
            <div className="hero-counter !static !mb-2">VAULT_ACCESS_GRANTED</div>
            <h1 className="font-display font-extrabold text-5xl tracking-tighter">System <span className="text-neon">Command</span></h1>
          </div>
          <div className="flex gap-4 reveal visible">
            {isDuress && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 font-mono text-[10px] uppercase tracking-widest clip-vault animate-pulse">
                <ShieldAlert className="w-4 h-4" /> DURESS_MODE_ACTIVE
              </div>
            )}
            <div className="px-6 py-2 bg-background2 border border-neon/10 text-neon font-mono text-[10px] uppercase tracking-widest clip-vault flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-neon animate-pulse" />
              0x71C...4f2D
            </div>
          </div>
        </header>

        {/* Balance & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 bg-background2 border border-neon/10 p-12 clip-vault relative overflow-hidden reveal visible">
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <Wallet className="w-64 h-64 text-neon" />
            </div>
            <div className="font-mono text-[11px] text-muted uppercase tracking-[0.4em] mb-8">TOTAL_SOLANA_EQUITY</div>
            <div className="flex items-baseline gap-6 mb-12">
              <span className="text-7xl font-display font-extrabold tracking-tighter">${balance}</span>
              <span className="text-neon font-mono text-lg flex items-center gap-2"><TrendingUp className="w-4 h-4" /> +2.44%</span>
            </div>
            <div className="flex gap-6">
              <button className="btn-primary !px-12 !py-4">Transmit</button>
              <button className="btn-outline !px-12 !py-4">Receive</button>
            </div>
          </div>

          <div className="bg-background2 border border-neon/10 p-10 clip-vault reveal visible">
            <div className="font-mono text-[11px] text-muted uppercase tracking-[0.4em] mb-8">SEC_PROTOCOL_STATUS</div>
            <div className="space-y-8">
              <StatusRow label="RHYTHM_SCORE" value="98.2%" status="SECURE" />
              <StatusRow label="BLOCK_INTEGRITY" value="VERIFIED" status="SECURE" />
              <StatusRow label="SKETCH_PARITY" value="STABLE" status="SECURE" />
              <StatusRow label="HARDWARE_LOCK" value="ACTIVE" status="SECURE" />
            </div>
            <div className="mt-12 pt-8 border-t border-neon/5 flex items-center gap-4">
              <ShieldCheck className="w-10 h-10 text-neon/30" />
              <div className="text-[10px] font-mono text-muted uppercase tracking-widest leading-relaxed">
                Biometric gate hardware enforced. session expires in 240s.
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <section className="reveal visible">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display font-extrabold text-2xl uppercase tracking-tight">Recent <span className="text-neon">Log</span></h2>
            <button className="font-mono text-[10px] text-muted uppercase tracking-widest hover:text-neon transition-colors">Export_CSV</button>
          </div>
          <div className="bg-background2 border border-neon/10 clip-vault divide-y divide-neon/5">
            <LogEntry type="Received" amount="+12.40 SOL" addr="0x334...A21" date="02:14:45" status="SUCCESS" />
            <LogEntry type="Sent" amount="-2.10 SOL" addr="0x992...E43" date="01:10:22" status="SUCCESS" />
            <LogEntry type="Contract" amount="0.00 SOL" addr="Vault.Registry" date="22:04:11" status="SUCCESS" />
          </div>
        </section>
      </main>
    </div>
  );
};

const StatusRow = ({ label, value, status }: any) => (
  <div className="flex justify-between items-center group">
    <div>
      <div className="text-[9px] font-mono text-muted uppercase tracking-widest mb-1">{label}</div>
      <div className="font-display font-bold text-lg">{value}</div>
    </div>
    <div className="px-3 py-1 bg-neon/5 border border-neon/20 text-neon font-mono text-[9px] uppercase tracking-tighter">
      {status}
    </div>
  </div>
);

const LogEntry = ({ type, amount, addr, date, status }: any) => (
  <div className="flex items-center justify-between p-8 hover:bg-neon/[0.02] transition-colors group">
    <div className="flex items-center gap-6">
      <div className={`w-12 h-12 flex items-center justify-center border ${type === 'Received' ? 'border-neon/30 text-neon' : 'border-white/10 text-text'}`}>
        {type === 'Received' ? <TrendingUp className="w-5 h-5" /> : <Send className="w-5 h-5" />}
      </div>
      <div>
        <div className="font-display font-bold text-xl uppercase tracking-tighter">{type} TRANSACTION</div>
        <div className="font-mono text-[10px] text-muted uppercase tracking-widest">{addr} • {date}</div>
      </div>
    </div>
    <div className="text-right">
      <div className={`font-display font-bold text-2xl ${type === 'Received' ? 'text-neon' : 'text-text'}`}>{amount}</div>
      <div className="font-mono text-[9px] text-muted uppercase tracking-widest">{status}</div>
    </div>
  </div>
);

export default Dashboard;
