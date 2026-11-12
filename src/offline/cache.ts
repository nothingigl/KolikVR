import { ui } from '../i18n/ui';
import type { ModuleId } from '../sim/model';
export type OfflineManifest = {
    version: string;
    scenes: Record<ModuleId, {
        urls: string[];
        bytes: number;
    }>;
};
export async function offlineAction(type: 'SAVE' | 'REMOVE' | 'STATUS', id: ModuleId): Promise<boolean> { if (!('serviceWorker' in navigator))
    throw Error(ui.text148); const registration = await navigator.serviceWorker.ready; const worker = navigator.serviceWorker.controller ?? registration.active; if (!worker)
    throw Error(ui.text149); return new Promise((resolve, reject) => { const channel = new MessageChannel(); const timeout = setTimeout(() => { channel.port1.close(); reject(Error(ui.text150)); }, 60000); channel.port1.onmessage = event => { clearTimeout(timeout); channel.port1.close(); if (event.data.ok)
    resolve(event.data.saved);
else
    reject(Error(event.data.error)); }; worker.postMessage({ type, id }, [channel.port2]); }); }
export async function registerOffline(onUpdate: (worker: ServiceWorker) => void) { if (!('serviceWorker' in navigator) || !import.meta.env.PROD)
    return; const registration = await navigator.serviceWorker.register('/sw.js'); if (registration.waiting)
    onUpdate(registration.waiting); registration.addEventListener('updatefound', () => { const worker = registration.installing; worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller)
    onUpdate(worker); }); }); }
