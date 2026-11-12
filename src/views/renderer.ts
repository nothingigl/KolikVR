import { ui } from '../i18n/ui';
import * as T from 'three';
import type { Simulation, ModuleId } from '../sim/model';
import { orbit } from '../adapters/orbit';
import { xrControls, type XRCallbacks } from '../adapters/xr';
import { QualityManager, type Quality } from './quality';
const builders = { energy: () => import('../scenes/energy'), motor: () => import('../scenes/motor'), gears: () => import('../scenes/gears'), regen: () => import('../scenes/regen'), battery: () => import('../scenes/battery') };
function release(group: T.Group) { const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>(); group.traverse(o => { if (o instanceof T.Mesh || o instanceof T.Line) {
    geometries.add(o.geometry);
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m: T.Material) => materials.add(m));
} }); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); group.clear(); }
export async function createView(host: HTMLElement, sim: Simulation, callbacks: XRCallbacks & {
    fallback: () => void;
    fps: (fps: number) => void;
}, initialModule: ModuleId = 'energy') {
    const scene = new T.Scene();
    scene.background = new T.Color(0x111815);
    const camera = new T.PerspectiveCamera(38, 1, .05, 100);
    const renderer = new T.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
    renderer.xr.enabled = true;
    renderer.outputColorSpace = T.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute('aria-label', ui.text157);
    scene.add(new T.HemisphereLight(0xeaffdf, 0x25352d, 3));
    const light = new T.DirectionalLight(0xffffff, 3);
    light.position.set(3, 5, 4);
    scene.add(light);
    const model = new T.Group();
    scene.add(model);
    const grid = new T.GridHelper(10, 20, 0x2d4235, 0x1d2b23);
    grid.position.y = -.65;
    scene.add(grid);
    const controls = orbit(renderer.domElement, camera, new T.Vector3(0, .2, 0));
    const xr = xrControls(renderer, scene, model, sim, callbacks);
    const qm = new QualityManager();
    let quality: Quality = 'auto', id: ModuleId = initialModule, disposed = false, version = 0, explode = false, hide = true, selected = '', ratio = sim.params.ratio;
    const size = () => { const w = host.clientWidth, h = host.clientHeight; camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix(); renderer.setSize(w, h); renderer.setPixelRatio(qm.pixelRatio); };
    const observer = new ResizeObserver(size);
    observer.observe(host);
    size();
    async function load(next: ModuleId) { id = next; xr.setScene(next); const ticket = ++version; const module = await builders[next](); if (disposed || ticket !== version)
        return; release(model); const group = module.build(sim.params.ratio); while (group.children.length)
        model.add(group.children[0]); ratio = sim.params.ratio; }
    try { await load(id); } catch (error) { xr.dispose(); controls.dispose(); observer.disconnect(); release(model); grid.geometry.dispose(); (grid.material as T.Material).dispose(); renderer.dispose(); renderer.domElement.remove(); throw error; }
    const ray = new T.Raycaster(), mouse = new T.Vector2();
    let pointerStart = { x: 0, y: 0 };
    const down = (e: PointerEvent) => { pointerStart = { x: e.clientX, y: e.clientY }; };
    const click = (e: PointerEvent) => { if (Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) > 6)
        return; const rect = renderer.domElement.getBoundingClientRect(); mouse.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1); ray.setFromCamera(mouse, camera); const hit = ray.intersectObject(model, true).find(h => h.object.visible && h.object.userData.part); if (hit)
        callbacks.select(hit.object.userData.part); };
    renderer.domElement.addEventListener('pointerdown', down);
    renderer.domElement.addEventListener('pointerup', click);
    const contextLost = (e: Event) => { e.preventDefault(); callbacks.fallback(); };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    let last = 0, renderKey = '', frames = 0, elapsed = 0;
    renderer.setAnimationLoop(time => {
        if (disposed)
            return;
        const dt = last ? Math.min((time - last) / 1000, .1) : 0;
        last = time;
        if (document.hidden && !renderer.xr.isPresenting)
            return;
        if (id === 'gears' && sim.params.ratio !== ratio) {
            ratio = sim.params.ratio;
            void load(id);
        }
        if (renderer.xr.isPresenting) sim.advance(dt); const s = sim.state;
        model.traverse(o => { if(o instanceof T.LOD){o.autoUpdate=qm.level>0;if(!o.autoUpdate)o.levels.forEach((level,i)=>{level.object.visible=i===1;});}const d = o.userData; if (d.base) {
            o.position.copy(d.base);
            if (explode && d.explode)
                o.position.add(d.explode);
        } if (d.shell)
            o.visible = !hide; if (d.flow !== undefined) {
            const t = (s.time * .5 + d.flow * .2) % 1;
            o.position.x = s.regenPower > 0 ? -1.6 + t * 2.7 : 1.1 - t * 2.7;
            o.visible = Math.abs(s.batteryPower) > 50;
        } if (d.spin) {
            const a = d.spin === 'motor' ? s.angle : d.spin === 'left' ? s.leftAngle : d.spin === 'right' ? s.rightAngle : -s.wheelAngle;
            const axis = id === 'gears' ? 'z' : id === 'motor' ? 'x' : 'z';
            o.rotation[axis] = a + (d.phase ?? 0);
        } if (o instanceof T.Mesh && o.material instanceof T.MeshStandardMaterial) {
            o.material.emissive.setHex(d.part === selected ? 0x1d3720 : 0);
            if (d.part === 'cooling')
                o.material.color.setHex(sim.params.cooling ? 0x73b8e6 : 0x68736c);
        } });
        xr.update(time);
        frames++;
        elapsed += dt;
        if (elapsed >= 1) {
            callbacks.fps(Math.round(frames / elapsed));
            frames = 0;
            elapsed = 0;
        }
        if (qm.sample(dt, quality === 'auto')) {
            renderer.setPixelRatio(qm.pixelRatio);
            model.traverse(o => { if (o instanceof T.Mesh && o.material instanceof T.MeshStandardMaterial)
                o.material.flatShading = qm.level === 0; });
        }
        // Pause redraws except occasional camera/parameter changes; no React state per frame.
        const key=[s.time,s.soc,hide,explode,selected,quality,id,ratio,sim.params.cooling,camera.position.x,camera.position.y,camera.position.z,host.clientWidth,host.clientHeight].join(',');if (renderer.xr.isPresenting || sim.running || key!==renderKey) {
            renderer.render(scene, camera);
            renderKey = key;
        }
    });
    return { load, setExplode: (v: boolean) => { explode = v; }, setShell: (v: boolean) => { hide = v; }, select: (v: string) => { selected = v; }, setQuality: (v: Quality) => { quality = v; qm.set(v); size(); }, resetCamera: controls.reset, enterVR: xr.enter, dispose() { disposed = true; version++; renderer.setAnimationLoop(null); xr.dispose(); controls.dispose(); observer.disconnect(); renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointerup', click); renderer.domElement.removeEventListener('webglcontextlost', contextLost); release(model); grid.geometry.dispose(); (grid.material as T.Material).dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); } };
}
export type View = Awaited<ReturnType<typeof createView>>;
