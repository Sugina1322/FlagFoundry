import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ReactMarkdown from 'react-markdown';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import {
  Activity,
  BookOpen,
  Check,
  Download,
  Flag,
  Flame,
  LayoutDashboard,
  LogOut,
  Play,
  Shield,
  Sparkles,
  Square,
  Target,
  TerminalSquare,
  Trophy,
  Upload,
  Users,
} from 'lucide-react';
import { api, clearSession, setSession, token } from './api';
import './styles.css';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';

function Badge({ children, tone = 'green' }) {
  const tones = {
    green: 'border-matrix/35 text-matrix bg-matrix/10',
    red: 'border-danger/45 text-danger bg-danger/10',
    gray: 'border-white/10 text-zinc-300 bg-white/5',
    aqua: 'border-aqua/35 text-aqua bg-aqua/10',
    amber: 'border-amber/35 text-amber bg-amber/10',
    orchid: 'border-orchid/35 text-orchid bg-orchid/10',
  };
  return <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${tones[tone] || tones.green}`}>{children}</span>;
}

function Button({ children, className = '', variant = 'primary', ...props }) {
  const variants = {
    primary: 'border-matrix/45 bg-matrix/15 text-matrix shadow-glow hover:bg-matrix/25',
    danger: 'border-danger/45 bg-danger/10 text-danger hover:bg-danger/20',
    ghost: 'border-white/10 bg-white/5 text-zinc-200 hover:border-matrix/35 hover:bg-white/8',
    warm: 'border-amber/40 bg-amber/10 text-amber hover:bg-amber/20',
  };
  return (
    <button className={`lift-hover min-h-11 rounded-lg border px-4 py-2 font-mono text-sm font-semibold transition ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

function difficultyTone(difficulty) {
  return {
    EASY: 'green',
    MEDIUM: 'amber',
    HARD: 'red',
    INSANE: 'orchid',
  }[difficulty] || 'green';
}

function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: 'student@flagfoundry.local', username: 'student', password: 'StudentPass123!' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const body = mode === 'login' ? { email: form.email, password: form.password } : form;
      const data = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) });
      setSession(data);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="scanline min-h-screen px-4 py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-3 rounded-lg border border-matrix/25 bg-matrix/10 px-4 py-3 font-mono text-matrix">
            <Shield size={26} />
            <span className="text-lg font-bold">FlagFoundry Academy</span>
          </div>
          <h1 className="max-w-3xl font-mono text-4xl font-bold leading-tight text-white md:text-6xl">
            Learn cyber skills through guided missions.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300 md:text-xl">
            Start a lab, follow friendly task cards, use the built-in Kali terminal, and collect flags as you build real methodology.
          </p>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              ['Guided', 'Step-by-step rooms', Sparkles, 'aqua'],
              ['Hands-on', 'Real containers', TerminalSquare, 'green'],
              ['Progress', 'Points and ranks', Trophy, 'amber'],
            ].map(([title, copy, Icon, tone]) => (
              <div key={title} className="glass-panel lift-hover rounded-lg p-4">
                <Icon className={tone === 'aqua' ? 'text-aqua' : tone === 'amber' ? 'text-amber' : 'text-matrix'} size={22} />
                <p className="mt-3 font-mono text-sm font-bold text-white">{title}</p>
                <p className="mt-1 text-sm text-zinc-400">{copy}</p>
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={submit} className="terminal-card mission-card rounded-lg p-6">
          <div className="mb-5">
            <p className="font-mono text-sm text-matrix">Welcome back, operator</p>
            <h2 className="mt-1 text-2xl font-bold text-white">{mode === 'login' ? 'Enter the training floor' : 'Create your operator profile'}</h2>
          </div>
          <div className="mb-5 flex gap-2">
            <Button type="button" variant={mode === 'login' ? 'primary' : 'ghost'} onClick={() => setMode('login')}>Login</Button>
            <Button type="button" variant={mode === 'register' ? 'primary' : 'ghost'} onClick={() => setMode('register')}>Register</Button>
          </div>
          <label className="mb-4 block text-sm text-zinc-300">
            Email
            <input className="mt-2 w-full rounded-lg border border-white/10 bg-black/45 px-3 py-3 font-mono text-white transition focus:border-matrix/50" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          {mode === 'register' && (
            <label className="mb-4 block text-sm text-zinc-300">
              Username
              <input className="mt-2 w-full rounded-lg border border-white/10 bg-black/45 px-3 py-3 font-mono text-white transition focus:border-matrix/50" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </label>
          )}
          <label className="mb-4 block text-sm text-zinc-300">
            Password
            <input type="password" className="mt-2 w-full rounded-lg border border-white/10 bg-black/45 px-3 py-3 font-mono text-white transition focus:border-matrix/50" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          {error && <p className="mb-4 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
          <Button className="w-full" type="submit"><Upload className="mr-2 inline" size={16} /> Enter platform</Button>
        </form>
      </section>
    </main>
  );
}

function Shell({ user, setUser }) {
  const [view, setView] = useState('dashboard');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [refresh, setRefresh] = useState(0);

  function logout() {
    clearSession();
    setUser(null);
  }

  return (
    <div className="scanline min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/10 bg-black/45 p-4 backdrop-blur-xl md:block">
        <div className="mb-7 rounded-lg border border-matrix/20 bg-matrix/10 p-4">
          <div className="flex items-center gap-3 font-mono font-bold text-matrix"><Shield /> FlagFoundry</div>
          <p className="mt-2 text-sm text-zinc-400">Mission control for hands-on security practice.</p>
        </div>
        {[
          ['dashboard', LayoutDashboard, 'Dashboard'],
          ['rooms', BookOpen, 'Rooms'],
          ['leaderboard', Trophy, 'Leaderboard'],
          ['terminal', TerminalSquare, 'Terminal'],
          ...(user.role === 'ADMIN' ? [['admin', Users, 'Admin']] : []),
        ].map(([id, Icon, label]) => (
          <button key={id} onClick={() => setView(id)} className={`lift-hover mb-2 flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 text-left font-mono text-sm transition ${view === id ? 'border-matrix/45 bg-matrix/12 text-matrix shadow-glow' : 'border-transparent text-zinc-300 hover:border-white/10 hover:bg-white/5'}`}>
            <Icon size={18} /> {label}
          </button>
        ))}
        <button onClick={logout} className="absolute bottom-4 left-4 right-4 flex min-h-11 items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 font-mono text-sm text-zinc-300 transition hover:border-danger/45 hover:text-danger">
          <LogOut size={18} /> Logout
        </button>
      </aside>
      <main className="p-4 md:ml-72 md:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div>
            <p className="font-mono text-sm text-matrix">Active operator</p>
            <h2 className="font-mono text-2xl font-bold text-white">{user.username}</h2>
          </div>
          <div className="flex gap-2">
            <Badge>{user.points} pts</Badge>
            <Badge tone="amber">{user.streak} day streak</Badge>
          </div>
        </header>
        {view === 'dashboard' && <Dashboard />}
        {view === 'rooms' && <Rooms onOpen={(room) => { setSelectedRoom(room); setView('room'); }} />}
        {view === 'room' && <RoomDetail slug={selectedRoom?.slug} onRefresh={() => setRefresh(refresh + 1)} />}
        {view === 'leaderboard' && <Leaderboard />}
        {view === 'terminal' && <BrowserTerminal roomSlug={selectedRoom?.slug || 'linux-basic'} />}
        {view === 'admin' && <Admin />}
      </main>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api('/users/dashboard').then(setData); }, []);
  if (!data) return <Panel>Loading dashboard...</Panel>;

  async function downloadVpn() {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/users/vpn-config`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${data.user.username}.ovpn`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <section className="mission-card glass-panel rounded-lg p-5 lg:col-span-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge tone="aqua">Training floor</Badge>
            <h3 className="mt-3 font-mono text-2xl font-bold text-white">Pick a mission, start the lab, capture the flag.</h3>
            <p className="mt-2 max-w-3xl text-zinc-300">Your next room will show target IPs, copyable commands, hints, and a Kali terminal in one place.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg border border-white/10 bg-black/30 p-3">
              <p className="font-mono text-2xl font-bold text-matrix">{data.user.points}</p>
              <p className="text-xs text-zinc-400">points</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/30 p-3">
              <p className="font-mono text-2xl font-bold text-amber">{data.user.streak}</p>
              <p className="text-xs text-zinc-400">streak</p>
            </div>
          </div>
        </div>
      </section>
      <Stat icon={Trophy} label="Rank" value={`#${data.rank}`} />
      <Stat icon={Check} label="Completed rooms" value={data.completedRooms.length} />
      <Stat icon={Activity} label="Tasks done" value={data.completedTasks} />
      <Stat icon={TerminalSquare} label="Running labs" value={data.runningLabs.length} />
      <section className="terminal-card rounded-lg p-5 lg:col-span-3">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-mono text-lg font-semibold text-white">Recent captures</h3>
          <Badge tone="green">flags</Badge>
        </div>
        <div className="space-y-3">
          {data.recentProgress.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm"><span>{item.flag.room.title}</span><Badge>owned</Badge></div>)}
          {!data.recentProgress.length && <p className="rounded-lg border border-dashed border-white/10 bg-black/20 p-4 text-zinc-400">No flags captured yet. Start with Linux Basic Foothold for the smoothest first win.</p>}
        </div>
      </section>
      <section className="terminal-card rounded-lg p-5">
        <h3 className="mb-4 font-mono text-lg font-semibold text-white">Access</h3>
        <button onClick={downloadVpn} className="lift-hover flex min-h-11 w-full items-center justify-center rounded-lg border border-aqua/40 bg-aqua/10 px-3 font-mono text-sm font-semibold text-aqua transition hover:bg-aqua/20">
          <Download size={16} className="mr-2" /> VPN config
        </button>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Optional for now. Local labs work through the browser terminal.</p>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return <div className="terminal-card lift-hover rounded-lg p-5"><Icon className="mb-4 text-matrix" /><p className="text-sm text-zinc-400">{label}</p><p className="font-mono text-3xl font-bold text-white">{value}</p></div>;
}

function Panel({ children }) {
  return <div className="terminal-card rounded-lg p-5 text-zinc-300">{children}</div>;
}

function Rooms({ onOpen }) {
  const [rooms, setRooms] = useState([]);
  useEffect(() => { api('/rooms').then((data) => setRooms(data.rooms)); }, []);
  return (
    <>
      <section className="mb-5 rounded-lg border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Badge tone="aqua">Room library</Badge>
            <h3 className="mt-3 font-mono text-2xl font-bold text-white">Choose your next mission</h3>
            <p className="mt-2 text-zinc-300">Start easy, follow the task cards, and use hints when you get stuck.</p>
          </div>
          <Badge tone="amber">{rooms.length} rooms</Badge>
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        {rooms.map((room) => {
          const running = room.instances?.[0]?.status === 'RUNNING';
          const completed = room.progress?.[0]?.completed;
          return (
            <button key={room.id} onClick={() => onOpen(room)} className="terminal-card mission-card lift-hover rounded-lg p-5 text-left hover:border-matrix/45">
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge tone={difficultyTone(room.difficulty)}>{room.difficulty}</Badge>
                <Badge tone="gray">{room.type.replaceAll('_', ' ')}</Badge>
                {running && <Badge tone="aqua">running</Badge>}
                {completed && <Badge tone="green">completed</Badge>}
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-lg border border-white/10 bg-black/35 p-3 text-matrix">
                  <Target size={22} />
                </div>
                <div>
                  <h3 className="font-mono text-xl font-bold text-white">{room.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-300">{room.description}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="font-mono text-sm text-matrix">{room.points} points</p>
                <span className="font-mono text-sm text-zinc-400">Open room</span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function RoomDetail({ slug }) {
  const [room, setRoom] = useState(null);
  const [flag, setFlag] = useState('');
  const [result, setResult] = useState('');
  const [labStatus, setLabStatus] = useState('');
  const [terminalNonce, setTerminalNonce] = useState(0);
  const [writeup, setWriteup] = useState({ title: '', body: '' });

  const load = () => api(`/rooms/${slug}`).then((data) => setRoom(data.room));
  useEffect(() => { if (slug) load(); }, [slug]);
  if (!room) return <Panel>Select a room.</Panel>;
  const instance = room.instances?.[0];
  const targetIp = instance?.targetIp;

  async function start() {
    setLabStatus('Starting lab containers...');
    try {
      const data = await api(`/rooms/${slug}/start`, { method: 'POST' });
      setLabStatus(data.instance?.status === 'RUNNING' ? 'Lab is running. Reopen the terminal if it was already connected.' : `Lab status: ${data.instance?.status || 'unknown'}`);
      await load();
      if (data.instance?.status === 'RUNNING') setTerminalNonce((value) => value + 1);
    } catch (error) {
      setLabStatus(`Start failed: ${error.message}`);
    }
  }
  async function stop() {
    setLabStatus('Stopping lab containers...');
    try {
      if (instance) await api(`/rooms/instances/${instance.id}/stop`, { method: 'POST' });
      setLabStatus('Lab stopped.');
      await load();
    } catch (error) {
      setLabStatus(`Stop failed: ${error.message}`);
    }
  }
  async function submitFlag(event) {
    event.preventDefault();
    const data = await api(`/rooms/${slug}/flags/submit`, { method: 'POST', body: JSON.stringify({ value: flag }) });
    setResult(data.correct ? 'Flag accepted.' : 'Flag rejected.');
  }
  async function submitWriteup(event) {
    event.preventDefault();
    await api(`/rooms/${slug}/writeups`, { method: 'POST', body: JSON.stringify(writeup) });
    setWriteup({ title: '', body: '' });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
      <section className="terminal-card rounded-lg p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-3 flex flex-wrap gap-2"><Badge tone={difficultyTone(room.difficulty)}>{room.difficulty}</Badge><Badge tone="gray">{room.type.replaceAll('_', ' ')}</Badge>{instance && <Badge tone={instance.status === 'RUNNING' ? 'aqua' : 'amber'}>{instance.status}</Badge>}</div>
            <h3 className="font-mono text-2xl font-bold text-white">{room.title}</h3>
            <p className="mt-2 max-w-3xl leading-7 text-zinc-300">{room.description}</p>
          </div>
          <div className="flex gap-2">{instance?.status === 'RUNNING' ? <Button variant="danger" onClick={stop}><Square size={16} className="mr-2 inline" /> Stop</Button> : <Button onClick={start}><Play size={16} className="mr-2 inline" /> Start</Button>}</div>
        </div>
        <div className="mb-5 flex flex-wrap gap-2"><Badge tone="orchid">{room.dockerImage}</Badge><Badge tone="green">{room.points} pts</Badge></div>
        {labStatus && <p className="mb-5 rounded-lg border border-white/10 bg-black/35 p-3 font-mono text-sm text-zinc-200">{labStatus}</p>}
        {targetIp && (
          <div className="mb-5 grid gap-3 rounded-lg border border-matrix/25 bg-matrix/5 p-4 md:grid-cols-2">
            <div>
              <p className="font-mono text-xs uppercase text-zinc-400">Target IP</p>
              <p className="font-mono text-xl font-bold text-matrix">{targetIp}</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-zinc-400">Kali IP</p>
              <p className="font-mono text-xl font-bold text-white">{instance.kaliIp}</p>
            </div>
            <QuickCommand command={`nmap -sV ${targetIp}`} />
            {room.slug === 'linux-basic' && <QuickCommand command={`ssh trainee@${targetIp}`} />}
          </div>
        )}
        <div className="space-y-4">
          {room.tasks.map((task) => <Task key={task.id} room={room} task={task} targetIp={targetIp} reload={load} />)}
        </div>
      </section>
      <aside className="space-y-4">
        <form onSubmit={submitFlag} className="terminal-card rounded-lg p-5">
          <h4 className="mb-3 flex items-center gap-2 font-mono text-lg font-bold text-white"><Flag size={18} /> Submit flag</h4>
          <input className="mb-3 w-full rounded-lg border border-white/10 bg-black/45 px-3 py-3 font-mono text-white transition focus:border-matrix/50" placeholder="FLAG{...}" value={flag} onChange={(e) => setFlag(e.target.value)} />
          <Button type="submit" className="w-full">Validate</Button>
          {result && <p className={`mt-3 rounded-lg border p-3 text-sm ${result.includes('accepted') ? 'border-matrix/30 bg-matrix/10 text-matrix' : 'border-danger/30 bg-danger/10 text-danger'}`}>{result}</p>}
        </form>
        <BrowserTerminal key={`${slug}-${instance?.status || 'none'}-${terminalNonce}`} roomSlug={slug} compact instanceStatus={instance?.status} />
        <form onSubmit={submitWriteup} className="terminal-card rounded-lg p-5">
          <h4 className="mb-3 font-mono text-lg font-bold text-white">Writeup</h4>
          <input className="mb-3 w-full rounded-lg border border-white/10 bg-black/45 px-3 py-3 text-white transition focus:border-matrix/50" placeholder="Title" value={writeup.title} onChange={(e) => setWriteup({ ...writeup, title: e.target.value })} />
          <textarea className="mb-3 min-h-28 w-full rounded-lg border border-white/10 bg-black/45 px-3 py-3 text-white transition focus:border-matrix/50" placeholder="Methodology, commands, remediation..." value={writeup.body} onChange={(e) => setWriteup({ ...writeup, body: e.target.value })} />
          <Button type="submit" className="w-full">Submit writeup</Button>
        </form>
      </aside>
    </div>
  );
}

function QuickCommand({ command }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }
  return (
    <button onClick={copy} className="lift-hover flex min-h-11 items-center justify-between rounded-lg border border-white/10 bg-black/35 px-3 font-mono text-sm text-zinc-200 transition hover:border-matrix/45">
      <span className="truncate">{command}</span>
      <span className="ml-3 text-matrix">{copied ? 'copied' : 'copy'}</span>
    </button>
  );
}

function Task({ room, task, targetIp, reload }) {
  const [message, setMessage] = useState('');
  const completed = Boolean(task.progress?.[0]?.completed);
  async function complete() {
    const data = await api(`/rooms/${room.slug}/tasks/${task.id}/complete`, { method: 'POST' });
    setMessage(data.alreadyCompleted ? 'Already checked off.' : `Task checked. +${data.awarded} points`);
    await reload();
  }
  async function hint(hintId) {
    const data = await api(`/rooms/${room.slug}/hints/${hintId}/unlock`, { method: 'POST' });
    setMessage(data.charged ? `Hint unlocked. -${data.hint.cost} points` : 'Hint already unlocked.');
    await reload();
  }
  const body = targetIp ? task.body.replaceAll('TARGET_IP', targetIp) : task.body;
  return (
    <article className={`rounded-lg border p-4 ${completed ? 'border-matrix/30 bg-matrix/5' : 'border-white/10 bg-black/30'}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h4 className="font-mono font-semibold text-white">{task.order}. {task.title}</h4>
          {completed && <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-matrix">Completed</p>}
        </div>
        <Button variant={completed ? 'primary' : 'ghost'} onClick={complete}>
          <Check size={16} className="mr-2 inline" /> {completed ? 'Done' : 'Check'}
        </Button>
      </div>
      <ReactMarkdown className="prose prose-invert max-w-none text-sm leading-6 text-zinc-300">{body}</ReactMarkdown>
      {message && <p className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-zinc-200">{message}</p>}
      <div className="mt-3 space-y-2">
        {task.hints.map((h) => {
          const unlocked = Boolean(h.unlocks?.length);
          return (
            <div key={h.id} className={`rounded-lg border p-3 ${unlocked ? 'border-aqua/25 bg-aqua/5' : 'border-white/10 bg-black/20'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-sm font-semibold text-white">Hint {h.order}</p>
                <Button variant={unlocked ? 'ghost' : 'warm'} onClick={() => hint(h.id)}>
                  {unlocked ? 'Unlocked' : `Unlock -${h.cost}`}
                </Button>
              </div>
              {unlocked ? <p className="mt-2 text-sm leading-6 text-zinc-300">{h.body}</p> : <p className="mt-2 text-sm text-zinc-500">Spend points to reveal this hint.</p>}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function BrowserTerminal({ roomSlug, compact = false, instanceStatus }) {
  const ref = useRef(null);
  const termRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const terminal = new Terminal({ cursorBlink: true, theme: { background: '#050607', foreground: '#00ff41' }, fontFamily: 'Fira Code, monospace', fontSize: 13 });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(ref.current);
    fit.fit();
    if (instanceStatus && instanceStatus !== 'RUNNING') {
      terminal.writeln(`room status: ${instanceStatus}`);
      terminal.writeln('click Start and wait for RUNNING before using the Kali terminal.');
      return () => terminal.dispose();
    }
    terminal.writeln(`connecting to ${roomSlug}...`);
    const socket = new WebSocket(`${WS_URL}/terminal?token=${token()}&room=${roomSlug}`);
    socket.onmessage = (event) => terminal.write(event.data);
    terminal.onData((data) => socket.readyState === WebSocket.OPEN && socket.send(data));
    termRef.current = terminal;
    return () => { socket.close(); terminal.dispose(); };
  }, [roomSlug, instanceStatus]);
  return <section className="terminal-card rounded-lg p-3"><div ref={ref} className={compact ? 'h-64' : 'h-[520px]'} /></section>;
}

function Leaderboard() {
  const [users, setUsers] = useState([]);
  useEffect(() => { api('/users/leaderboard').then((data) => setUsers(data.users)); }, []);
  return (
    <section className="terminal-card rounded-lg p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <Badge tone="amber">Leaderboard</Badge>
          <h3 className="mt-3 font-mono text-2xl font-bold text-white">Top operators</h3>
        </div>
        <Trophy className="text-amber" />
      </div>
      {users.map((u, i) => (
        <div key={u.id} className="mb-2 flex items-center justify-between rounded-lg border border-white/10 bg-black/25 px-4 py-3">
          <span className="font-mono text-white">#{i + 1} {u.username}</span>
          <span className="text-matrix">{u.points} pts</span>
        </div>
      ))}
    </section>
  );
}

function Admin() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ slug: '', title: '', description: '', type: 'CTF_CHALLENGE', difficulty: 'EASY', points: 100, dockerImage: 'flagfoundry/custom:latest', flagValue: 'FLAG{change_me}' });
  const load = () => api('/admin/rooms').then((data) => setRooms(data.rooms));
  useEffect(() => { load(); }, []);
  async function create(event) {
    event.preventDefault();
    await api('/admin/rooms', { method: 'POST', body: JSON.stringify({ ...form, points: Number(form.points) }) });
    await load();
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
      <form onSubmit={create} className="terminal-card rounded-lg p-5">
        <h3 className="mb-4 font-mono text-lg font-bold text-white">Create room</h3>
        {['slug', 'title', 'description', 'dockerImage', 'flagValue'].map((field) => <input key={field} className="mb-3 w-full rounded-lg border border-white/10 bg-black/45 px-3 py-3 text-white transition focus:border-matrix/50" placeholder={field} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />)}
        <select className="mb-3 w-full rounded-lg border border-white/10 bg-black/45 px-3 py-3 text-white transition focus:border-matrix/50" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{['LINUX_FUNDAMENTALS', 'WEB_EXPLOITATION', 'PRIVILEGE_ESCALATION', 'CTF_CHALLENGE'].map((v) => <option key={v}>{v}</option>)}</select>
        <Button className="w-full">Create</Button>
      </form>
      <section className="terminal-card rounded-lg p-5">{rooms.map((room) => <div key={room.id} className="mb-2 rounded-lg border border-white/10 bg-black/25 p-3"><p className="font-mono text-white">{room.title}</p><p className="text-sm text-zinc-400">{room.dockerImage}</p></div>)}</section>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('flagfoundry_user') || 'null'));
  useEffect(() => { if (token()) api('/auth/me').then((data) => setUser(data.user)).catch(() => clearSession()); }, []);
  return user ? <Shell user={user} setUser={setUser} /> : <Auth onAuth={setUser} />;
}

createRoot(document.getElementById('root')).render(<App />);
