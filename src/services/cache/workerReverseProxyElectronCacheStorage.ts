import * as Comlink from 'comlink';
import {
    LimitedCache,
    LimitedCacheStorage,
    ProxiedWorkerLimitedCache,
} from 'types/cache';
import WorkerProxyElectronCacheStorage from './workerProxyElectronCacheStorage';
import { wrap } from 'comlink';
import { deserializeToResponse, serializeResponse } from 'utils/comlink/proxy';

export default class WorkerReverseProxyElectronCacheStorage
    implements LimitedCacheStorage
{
    proxiedElectronCacheService: Comlink.Remote<WorkerProxyElectronCacheStorage>;
    ready: Promise<any>;

    constructor() {
        this.ready = this.init();
    }
    async init() {
        const electronCacheStorageProxy =
            wrap<typeof WorkerProxyElectronCacheStorage>(self);

        this.proxiedElectronCacheService =
            await new electronCacheStorageProxy();
    }
    async open(cacheName: string) {
        await this.ready;
        const cache = await this.proxiedElectronCacheService.open(cacheName);
        return {
            match: transformMatch(cache.match.bind(cache)),
            put: transformPut(cache.put.bind(cache)),
            delete: cache.delete.bind(cache),
        };
    }

    async delete(cacheName: string) {
        return await this.proxiedElectronCacheService.delete(cacheName);
    }
}

function transformMatch(
    fn: ProxiedWorkerLimitedCache['match']
): LimitedCache['match'] {
    return async (key: string) => {
        return deserializeToResponse(await fn(key));
    };
}

function transformPut(
    fn: ProxiedWorkerLimitedCache['put']
): LimitedCache['put'] {
    return async (key: string, data: Response) => {
        fn(key, await serializeResponse(data));
    };
}
