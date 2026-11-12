import { ui } from './i18n/ui';
import { useEffect, useRef, useState } from 'react';
import { Simulation, type ModuleId, type Parameters } from './sim/model';
import { modules, ru, guide } from './i18n/ru';
import Diagram from './views/Diagram';
import type { View } from './views/renderer';
import type { Quality } from './views/quality';
import { offlineAction, registerOffline, type OfflineManifest } from './offline/cache';
type InstallEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{
        outcome: string;
    }>;
};
const fmt = (n: number, d = 0) => Number.isFinite(n) ? n.toLocaleString('ru-RU', { maximumFractionDigits: d, minimumFractionDigits: d }) : '0';
export default function App() {
    const sim = useRef(new Simulation()).current;
    const [tab, setTab] = useState(0), [id, setId] = useState<ModuleId>('energy'), [active, setActive] = useState(false), [mode, setMode] = useState<'3d' | '2d'>('3d'), [quality, setQuality] = useState<Quality>(() => { try {
        return (localStorage.getItem('autoscope-quality') as Quality) || 'auto';
    }
    catch {
        return 'auto';
    } }), [state, setState] = useState({ ...sim.state }), [running, setRunning] = useState(false), [params, setParams] = useState({ ...sim.params }), [selected, setSelected] = useState('battery'), [explode, setExplode] = useState(false), [hide, setHide] = useState(true), [message, setMessage] = useState(''), [loading, setLoading] = useState(false), [xrSupported, setXRSupported] = useState(false), [fps, setFps] = useState(0), [saved, setSaved] = useState<Partial<Record<ModuleId, boolean>>>({}), [saving, setSaving] = useState(false), [offlineManifest, setOfflineManifest] = useState<OfflineManifest | null>(null), [update, setUpdate] = useState<ServiceWorker | null>(null), [install, setInstall] = useState<InstallEvent | null>(null), [online, setOnline] = useState(navigator.onLine), [panelOpen, setPanelOpen] = useState(true), [stereo, setStereo] = useState(35);
    const host = useRef<HTMLDivElement>(null), view = useRef<View | null>(null);
    const description = modules.find(m => m.id === id)!;
    const callbackRef = useRef({ setId, setExplode, setHide, setSelected });
    callbackRef.current = { setId, setExplode, setHide, setSelected };
    useEffect(() => { let raf = 0, last = 0, ui = 0; const tick = (t: number) => { const dt = last ? Math.min((t - last) / 1000, .1) : 0; last = t; if (!document.hidden) {
        if (!sim.xrActive) sim.advance(dt);
        if (t - ui > 100) {
            ui = t;
            setState({ ...sim.state });
            setRunning(sim.running);
            setParams({ ...sim.params });
        }
    } raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); const keyboard = (e: KeyboardEvent) => { if (e.code === 'Space' && !['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) && active && tab < 2) {
        e.preventDefault();
        sim.running ? sim.pause() : sim.start();
    } }; window.addEventListener('keydown', keyboard); return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', keyboard); sim.pause(); }; }, [sim, active, tab]);
    useEffect(() => { let live = true; try {
        navigator.xr?.isSessionSupported('immersive-vr').then(v => { if (live)
            setXRSupported(v); }).catch(() => setXRSupported(false));
    }
    catch {
        setXRSupported(false);
    } registerOffline(setUpdate).catch(() => setMessage(ui.text1)); fetch('/offline-manifest.json').then(r => r.json()).then(setOfflineManifest).catch(() => { }); const before = (e: Event) => { e.preventDefault(); setInstall(e as InstallEvent); }; const network = () => setOnline(navigator.onLine); window.addEventListener('beforeinstallprompt', before); window.addEventListener('online', network); window.addEventListener('offline', network); return () => { live = false; window.removeEventListener('beforeinstallprompt', before); window.removeEventListener('online', network); window.removeEventListener('offline', network); }; }, []);
    useEffect(() => { if (!import.meta.env.PROD)
        return; let live = true; Promise.all(modules.map(async (m) => { try {
        const value = await offlineAction('STATUS', m.id);
        if (live)
            setSaved(prev => ({ ...prev, [m.id]: value }));
    }
    catch { } })); return () => { live = false; }; }, [offlineManifest]);
    useEffect(() => { if (!active || mode !== '3d' || tab > 1 || !host.current)
        return; let cancelled = false; let local: View | null = null; setLoading(true); import('./views/renderer').then(m => { if (cancelled || !host.current)
        return; return m.createView(host.current, sim, { scene: v => callbackRef.current.setId(v), explode: () => callbackRef.current.setExplode(v => !v), shell: () => callbackRef.current.setHide(v => !v), select: v => callbackRef.current.setSelected(v), status: setMessage, fps: setFps, fallback: () => { setMessage(ui.text2); setMode('2d'); } }); }).then(v => { if (!v)
        return; local = v; if (cancelled) {
        v.dispose();
        return;
    } view.current = v; v.setQuality(quality); v.setExplode(explode); v.setShell(hide); v.select(selected); return v.load(id); }).catch(() => { if (!cancelled) {
        setMode('2d');
        setMessage(ui.text3);
    } }).finally(() => { if (!cancelled)
        setLoading(false); }); return () => { cancelled = true; local?.dispose(); if (view.current === local)
        view.current = null; }; }, [active, mode, tab, sim]);
    useEffect(() => { view.current?.load(id).catch(() => { setMessage(ui.text4); setMode('2d'); }); }, [id]);
    useEffect(() => { view.current?.setExplode(explode); }, [explode]);
    useEffect(() => { view.current?.setShell(hide); }, [hide]);
    useEffect(() => { view.current?.select(selected); }, [selected]);
    useEffect(() => { view.current?.setQuality(quality); try {
        localStorage.setItem('autoscope-quality', quality);
    }
    catch { } }, [quality]);
    const change = <K extends keyof Parameters>(key: K, value: Parameters[K]) => { sim.setParameter(key, value); setParams({ ...sim.params }); setState({ ...sim.state }); };
    const open = (next: ModuleId) => { sim.pause(); sim.reset(); setState({ ...sim.state }); setId(next); setSelected(modules.find(m => m.id === next)!.parts[0]); setTab(0); setActive(true); };
    const reset = () => { sim.reset(); setState({ ...sim.state }); setRunning(false); setExplode(false); setHide(true); view.current?.resetCamera(); };
    const cache = async () => { setSaving(true); try {
        const value = await offlineAction(saved[id] ? 'REMOVE' : 'SAVE', id);
        setSaved(p => ({ ...p, [id]: value }));
        setMessage(value ? ui.text5 : ui.text6);
    }
    catch (e) {
        setMessage(ui.text7 + (e instanceof Error ? e.message : String(e)));
    }
    finally {
        setSaving(false);
    } };
    const slider = (key: 'throttle' | 'brake' | 'load' | 'ratio' | 'turn' | 'initialSoc' | 'demoSpeed', label: string, min: number, max: number, step: number, unit: string, scale = 1) => <label className="slider" key={key}><span>{label}<output>{fmt(params[key] * scale, key === 'demoSpeed' ? 2 : 0)} {unit}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={params[key]} onChange={e => change(key, Number(e.target.value))}/><span className="range-ends"><small>{min * scale} {unit}</small><small>{max * scale} {unit}</small></span></label>;
    const info = ru.parts[selected] ?? ru.parts.battery;
    return <div className="app"><aside className="sidebar"><a className="brand" href="#" onClick={e => { e.preventDefault(); setTab(0); }}><span className="logo-mark">A<span>•</span></span><span>{ru.brand}<small>{ru.tagline}</small></span></a><div className="sidebar-label">{ui.text8}</div><nav aria-label={ui.text9}>{ru.nav.map((label, i) => <button key={label} className={tab === i ? 'nav-item chosen' : 'nav-item'} onClick={() => { setTab(i); sim.pause(); }}><span className="nav-icon">{['▱', '⚙', '◉', '≡'][i]}</span>{label}<span className="nav-arrow">↗</span></button>)}</nav><div className="sidebar-bottom"><div className="live-dot"/>{ui.text10}<p>{ui.text11}<br />{ui.text12}</p><span className="version">AUTOSCOPE / V1.0</span></div></aside>
 <main><header className="topbar"><div className="breadcrumb">{ui.text13}<span>/</span> <strong>{ru.nav[tab]}</strong></div><div className="top-actions"><span className={'connection ' + (!online ? 'offline' : '')}><i />{online ? ui.text14 : ui.text15}</span>{install && <button className="quiet" onClick={async () => { await install.prompt(); await install.userChoice; setInstall(null); }}>{ui.text16}</button>}<span className="edition">{ui.text17}</span></div></header>
 {message && <div role="status" className="notice"><span>{message}</span><button aria-label={ui.text18} onClick={() => setMessage('')}>×</button></div>}{update && <div className="notice"><span>{ui.text19}</span><button disabled={running} onClick={() => { if (sim.running)
        return; update.postMessage({ type: 'ACTIVATE' }); navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true }); }}>{ui.text20}{running ? ui.text21 : ''}</button></div>}
 <div className="page-content">{tab < 2 ? <><div className="page-heading"><div><div className="eyebrow">{ui.text22}</div><h1>{tab === 1 ? ui.text23 : ui.text24}</h1><p>{tab === 1 ? ui.text25 : ui.text26}</p></div><span className="index-label">EV / 01—05</span></div>
 {tab === 1 ? <div className="catalog">{modules.map((m, i) => <button className="catalog-card" key={m.id} onClick={() => open(m.id)}><div className="catalog-visual"><span>{m.symbol}</span><small>{ui.text27}{i + 1}</small></div><h2>{m.title}</h2><p>{m.short}</p><span className="catalog-go">{ui.text28}{saved[m.id] ? ui.text29 : ''}</span></button>)}</div> : <><section className="workbench"><div className="workspace"><div className="scene-bar"><div className="scene-title"><span className="live-dot"/>{active ? description.title : ui.text30}</div><div className="segmented" aria-label={ui.text31}><button aria-pressed={mode === '3d'} className={mode === '3d' ? 'is-active' : ''} onClick={() => setMode('3d')}>3D</button><button aria-pressed={mode === '2d'} className={mode === '2d' ? 'is-active' : ''} onClick={() => { setMode('2d'); setActive(true); }}>2D</button></div></div>
 <div className="scene-stage">{!active ? <><Diagram id="energy" state={state} select={setSelected} staticPreview/><div className="preview-overlay"><span className="preview-label">{ui.text32}</span><button className="primary" onClick={() => setActive(true)}>{ui.text33}{mode === '3d' ? '3D' : '2D'} <span>↗</span></button><small>{ui.text34}</small></div></> : mode === '2d' ? <Diagram id={id} state={state} select={setSelected} exploded={explode} hide={hide}/> : <div className="canvas-host" ref={host}/>}<div className="scene-caption"><span className="axis">Y ↑ &nbsp; X ↗ &nbsp; Z →</span><span>{active ? (mode === '3d' ? `${fps || '—'} FPS · ` : '') + ui.text35 : ui.text36}</span></div>{loading && <div className="loading" role="status">{ui.text37}</div>}</div>
 <div className="scene-tools"><div><button disabled={!active} aria-pressed={explode} onClick={() => setExplode(!explode)}>↗ {explode ? ui.text38 : ui.text39}</button><button disabled={!active} aria-pressed={hide} onClick={() => setHide(!hide)}>▧ {hide ? ui.text40 : ui.text41}</button>{mode === '3d' && active && <button onClick={() => view.current?.resetCamera()}>{ui.text42}</button>}</div><button className="vr-button" disabled={!xrSupported || !active || mode === '2d' || loading} title={xrSupported ? ui.text43 : ui.text44} onClick={() => view.current?.enterVR()}>{ui.text45}</button></div>
 <div className="scene-footnote">{active ? ui.text46 : ui.text47}</div></div>
 <aside className="controls"><div className="controls-heading"><span className="eyebrow">{ui.text48}</span><button className="mobile-toggle" aria-expanded={panelOpen} onClick={() => setPanelOpen(!panelOpen)}>{ui.text49}{panelOpen ? '−' : '+'}</button><span className="number">0{modules.findIndex(m => m.id === id) + 1}</span></div><h2>{description.title}</h2><p className="module-description">{description.description}</p><div className="playback"><button className="primary" onClick={() => { if (!active)
                setActive(true); sim.running ? sim.pause() : sim.start(); setRunning(sim.running); }}>{running ? ui.text50 : ui.text51}</button><button aria-label={ui.text52} onClick={reset}>↺</button></div><div className={panelOpen ? 'parameter-body' : 'parameter-body collapsed'}>
 {slider('throttle', ui.text53, 0, 1, .01, '%', 100)}{slider('brake', ui.text54, 0, 1, .01, '%', 100)}{(id === 'energy' || id === 'battery' || id === 'motor') && slider('load', ui.text55, 0, 1, .01, '%', 100)}{id === 'gears' && <>{slider('ratio', ui.text56, 3, 10, 1, ': 1')}{slider('turn', ui.text57, -1, 1, .05, '')}<p className="mini-note">{ui.text58}{12 * params.ratio}{ui.text59}</p></>}{(id === 'battery' || id === 'regen') && slider('initialSoc', ui.text60, 0, 100, 1, '%')}{id === 'battery' && <label className="switch-row">{ui.text61}<input type="checkbox" checked={params.cooling} onChange={e => change('cooling', e.target.checked)}/></label>}
 <div className="divider"/>{slider('demoSpeed', ui.text62, .25, 2, .25, '×')}<label className="quality-label">{ui.text63}<select aria-label={ui.text64} value={quality} onChange={e => setQuality(e.target.value as Quality)}>{['auto', 'low', 'medium', 'high'].map((v, i) => <option key={v} value={v}>{ru.quality[i]}</option>)}</select></label>
 <div className="telemetry"><div><small>{ui.text65}</small><strong>{fmt(state.speed * 3.6, 1)}<span>{ui.text66}</span></strong></div><div><small>{ui.text67}</small><strong>{fmt(state.soc, 1)}<span> %</span></strong></div><div><small>{ui.text68}</small><strong>{fmt(state.torque)}<span>{ui.text69}</span></strong></div><div><small>{ui.text70}</small><strong>{fmt(state.temperature, 1)}<span> °C</span></strong></div></div></div></aside></section>
 <div className="below-scene"><section className="explanation"><div className="section-label"><span>{ui.text71}</span><span className="pill">{running ? ui.text72 : ui.text73}</span></div><h3>{state.regenPower > 0 ? ui.text74 : params.brake > 0 ? ui.text75 : state.speed > 0 ? ui.text76 : ui.text77}</h3><p>{state.regenPower > 0 ? ui.text78(fmt(state.regenPower / 1000, 1), fmt(state.frictionPower / 1000, 1)) : params.brake > 0 ? ui.text79 : ui.text80}</p><div className="energy-chain"><span>{ui.text81}</span><b>{state.regenPower > 0 ? '←' : '→'}</b><span>{ui.text82}</span><b>{state.regenPower > 0 ? '←' : '→'}</b><span>{ui.text83}</span><b>{state.regenPower > 0 ? '←' : '→'}</b><span>{ui.text84}</span></div><div className="measurements"><span>{fmt(state.rpm)}{ui.text85}</span><span>{fmt(state.leftRpm)} / {fmt(state.rightRpm)}{ui.text86}</span><span>{fmt(state.batteryPower / 1000, 1)}{ui.text87}</span><span>{fmt(state.wheelTorque)}{ui.text88}</span></div>{id === 'battery' && <p className="mini-note">{ui.text89}</p>}</section><section className="part-card"><div className="section-label">{ui.text90}</div><div className="part-buttons">{description.parts.map(p => <button key={p} className={selected === p ? 'selected' : ''} onClick={() => setSelected(p)}>{ru.parts[p][0]}</button>)}</div><h3>{info[0]}</h3><p>{info[1]}</p><div className="offline-row"><button disabled={saving || !offlineManifest || (!online && !saved[id])} onClick={cache}>{saving ? ui.text91 : saved[id] ? ui.text92 : ui.text93}</button><small>{offlineManifest ? fmt(offlineManifest.scenes[id].bytes / 1024 / 1024, 2) + ui.text94 : ui.text95}</small></div></section></div></>}
 <section className="modules-section"><div className="section-heading"><h2>{ui.text96}</h2><span>{ui.text97}</span></div><div className="module-strip">{modules.map((m, i) => <button key={m.id} className={id === m.id && tab === 0 ? 'module-tile current' : 'module-tile'} onClick={() => open(m.id)}><span className="tile-top"><span>0{i + 1}</span><span>↗</span></span><span className="tile-symbol">{m.symbol}</span><strong>{m.title}</strong><small>{m.short}</small>{saved[m.id] && <small>{ui.text98}</small>}</button>)}</div></section></> : tab === 2 ? <><div className="page-heading"><div><div className="eyebrow">{ui.text99}</div><h1>{ui.text100}</h1><p>{ui.text101}</p></div></div><div className="info-layout"><section className="stereo-card"><div className="lens-pair">{[-1, 1].map(side => <div className="lens" key={side}><span style={{ transform: `translateX(${side * stereo / 4}px)` }}>▱</span></div>)}</div><h2>{ui.text102}</h2><p>{ui.text103}</p><label className="slider"><span>{ui.text104}<output>{stereo}%</output></span><input aria-label={ui.text105} type="range" min="0" max="100" value={stereo} onChange={e => setStereo(+e.target.value)}/></label></section><div className="info-cards">{[[ui.text106, ui.text107], [ui.text108, ui.text109], [ui.text110, ui.text111], [ui.text112, ui.text113]].map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div></div><p className="technical-note">{xrSupported ? ui.text114 : ui.text115}{ui.text116}</p></> : <><div className="page-heading"><div><div className="eyebrow">{ui.text117}</div><h1>{ui.text118}</h1><p>{ui.text119}</p></div></div><div className="guide-list">{guide.map(([title, text], i) => <details key={title} open={i === 0}><summary><span>0{i + 1}</span>{title}</summary><p>{text}</p></details>)}</div><div className="technical-note"><h3>{ui.text120}</h3><p>{ui.text121}</p></div></>}
 <footer><span><b>AutoScope</b>{ui.text122}</span><span>{ui.text123}</span></footer></div></main></div>;
}
