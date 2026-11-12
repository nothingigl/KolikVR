import { ui } from '../i18n/ui';
import * as T from 'three';
import type { Simulation, ModuleId } from '../sim/model';
import { modules, ru } from '../i18n/ru';
export type XRCallbacks = {
    scene: (id: ModuleId) => void;
    explode: () => void;
    shell: () => void;
    status: (s: string) => void;
    select: (part: string) => void;
};
export function xrControls(renderer: T.WebGLRenderer, scene: T.Scene, model: T.Group, sim: Simulation, callbacks: XRCallbacks) {
    const panel = new T.Group();
    panel.position.set(0, 1, -1.4);
    panel.visible = false;
    scene.add(panel);
    const targets: T.Mesh[] = [];
    const cleanups: (() => void)[] = [];
    let current = 0;
    let selected = 0;
    let detail = ui.text124;
    const detailCanvas = document.createElement('canvas');
    detailCanvas.width = 1024;
    detailCanvas.height = 256;
    const detailTexture = new T.CanvasTexture(detailCanvas);
    const detailMesh = new T.Mesh(new T.PlaneGeometry(1.8, .45), new T.MeshBasicMaterial({ map: detailTexture }));
    detailMesh.position.set(0, -.92, .01);
    panel.add(detailMesh);
    const choose = (part: string) => { callbacks.select(part); detail = (ru.parts[part] ?? ru.parts.shell).join(': '); };
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 1024;
    labelCanvas.height = 128;
    const labelTexture = new T.CanvasTexture(labelCanvas);
    const label = new T.Mesh(new T.PlaneGeometry(1.8, .225), new T.MeshBasicMaterial({ map: labelTexture }));
    label.position.set(0, .64, .01);
    panel.add(label);
    function button(text: string, x: number, y: number, action: () => void) { const canvas = document.createElement('canvas'); canvas.width = 384; canvas.height = 96; const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#253a30'; ctx.fillRect(0, 0, 384, 96); ctx.strokeStyle = '#bde899'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, 380, 92); ctx.fillStyle = '#eef5ed'; ctx.font = '26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(text, 192, 58); const texture = new T.CanvasTexture(canvas); const mesh = new T.Mesh(new T.PlaneGeometry(.55, .14), new T.MeshBasicMaterial({ map: texture })); mesh.position.set(x, y, 0); mesh.userData.action = action; panel.add(mesh); targets.push(mesh); }
    const adjust = (key: 'throttle' | 'brake' | 'initialSoc' | 'load' | 'ratio' | 'turn' | 'demoSpeed', delta: number, min: number, max: number) => () => { const next = sim.params[key] + delta; sim.setParameter(key, next > max ? min : next); };
    const actions: [
        string,
        () => void
    ][] = [[ui.text125, () => sim.running ? sim.pause() : sim.start()], [ui.text126, () => { current = (current + 1) % modules.length; callbacks.scene(modules[current].id); }], [ui.text127, () => sim.reset()], [ui.text128, adjust('throttle', .25, 0, 1)], [ui.text129, adjust('brake', .25, 0, 1)], [ui.text130, adjust('initialSoc', 10, 10, 100)], [ui.text131, adjust('load', .25, 0, 1)], [ui.text132, adjust('ratio', 1, 3, 10)], [ui.text133, adjust('turn', .5, -1, 1)], [ui.text134, () => sim.setParameter('cooling', !sim.params.cooling)], [ui.text135, adjust('demoSpeed', .5, .25, 2)], [ui.text136, () => { const keys = Object.keys(ru.parts); selected = (selected + 1) % keys.length; choose(keys[selected]); }], [ui.text137, callbacks.explode], [ui.text138, callbacks.shell], [ui.text139, () => { model.position.set(0, 1.7, -2.7); model.rotation.set(0, 0, 0); }], [ui.text140, () => { model.rotation.y += Math.PI / 8; }], [ui.text141, () => void renderer.xr.getSession()?.end()]];
    actions.forEach(([text, fn], i) => button(text, (i % 3 - 1) * .59, .42 - Math.floor(i / 3) * .18, fn));
    const ray = new T.Raycaster(), rotation = new T.Matrix4();
    const held = new Set<T.Group>();
    const controllers: T.Group[] = [];
    for (let i = 0; i < 2; i++) {
        const controller = renderer.xr.getController(i);
        scene.add(controller);
        controllers.push(controller);
        const line = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, 0), new T.Vector3(0, 0, -4)]), new T.LineBasicMaterial({ color: 0xbde899 }));
        controller.add(line);
        const select = () => { rotation.identity().extractRotation(controller.matrixWorld); ray.ray.origin.setFromMatrixPosition(controller.matrixWorld); ray.ray.direction.set(0, 0, -1).applyMatrix4(rotation); const hit = ray.intersectObjects(targets, false)[0]; if (hit) {
            (hit.object.userData.action as () => void)();
            return;
        } const partHit = ray.intersectObject(model, true)[0]; if (partHit?.object.userData.part)
            choose(partHit.object.userData.part); };
        const squeeze = () => { controller.attach(model); held.add(controller); };
        const release = () => { scene.attach(model); held.delete(controller); };
        controller.addEventListener('selectstart', select);
        controller.addEventListener('squeezestart', squeeze);
        controller.addEventListener('squeezeend', release);
        cleanups.push(() => { controller.removeEventListener('selectstart', select); controller.removeEventListener('squeezestart', squeeze); controller.removeEventListener('squeezeend', release); controller.remove(line); scene.remove(controller); line.geometry.dispose(); (line.material as T.Material).dispose(); });
    }
    const start = () => { sim.xrActive = true; panel.visible = true; model.position.set(0, 1.7, -2.7); model.scale.setScalar(.55); };
    const end = () => { sim.xrActive = false; scene.attach(model); held.clear(); panel.visible = false; model.position.set(0, 0, 0); model.scale.setScalar(1); model.rotation.set(0, 0, 0); };
    renderer.xr.addEventListener('sessionstart', start);
    renderer.xr.addEventListener('sessionend', end);
    let last = 0;
    return { setScene(id: ModuleId) { current = modules.findIndex(m => m.id === id); }, async enter() { try {
            if (!navigator.xr || !await navigator.xr.isSessionSupported('immersive-vr'))
                throw new Error(ui.text142);
            const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] });
            await renderer.xr.setSession(session);
        }
        catch (e) {
            callbacks.status(ui.text143 + (e instanceof Error ? e.message : String(e)));
        } }, update(now: number) {
            if (!renderer.xr.isPresenting)
                return;
            const session = renderer.xr.getSession();
            for (const source of session?.inputSources ?? []) {
                const axes = source.gamepad?.axes;
                if (axes && axes.length >= 2) {
                    const x = axes[axes.length - 2], y = axes[axes.length - 1];
                    if (Math.abs(x) > .2)
                        model.rotation.y += x * .025;
                    if (Math.abs(y) > .2 && !held.size)
                        model.position.z = T.MathUtils.clamp(model.position.z - y * .015, -4, -1.5);
                }
            }
            if (now - last > 200) {
                last = now;
                const ctx = labelCanvas.getContext('2d')!;
                ctx.fillStyle = '#111815';
                ctx.fillRect(0, 0, 1024, 128);
                ctx.fillStyle = '#eef5ed';
                ctx.font = '28px sans-serif';
                ctx.fillText(ui.text144(sim.running ? '▶' : 'Ⅱ', modules[current].title, (sim.state.speed * 3.6).toFixed(0), sim.state.soc.toFixed(1), sim.state.temperature.toFixed(1)), 16, 40);
                ctx.font = '24px sans-serif';
                ctx.fillText(ui.text145(sim.params.throttle * 100, sim.params.brake * 100, sim.params.ratio, sim.params.cooling ? ui.text146 : ui.text147), 16, 86);
                labelTexture.needsUpdate = true;
                const dc = detailCanvas.getContext('2d')!;
                dc.fillStyle = '#111815';
                dc.fillRect(0, 0, 1024, 256);
                dc.fillStyle = '#d9eace';
                dc.font = '25px sans-serif';
                const words = detail.split(' ');
                let line = '', y = 42;
                for (const word of words) {
                    if (dc.measureText(line + word).width > 970) {
                        dc.fillText(line, 20, y);
                        y += 38;
                        line = '';
                    }
                    line += word + ' ';
                }
                dc.fillText(line, 20, y);
                detailTexture.needsUpdate = true;
            }
        }, dispose() { sim.xrActive = false; renderer.xr.getSession()?.end(); renderer.xr.removeEventListener('sessionstart', start); renderer.xr.removeEventListener('sessionend', end); cleanups.forEach(fn => fn()); scene.remove(panel); panel.traverse(o => { if (o instanceof T.Mesh) {
            o.geometry.dispose();
            const m = o.material as T.MeshBasicMaterial;
            m.map?.dispose();
            m.dispose();
        } }); } };
}
