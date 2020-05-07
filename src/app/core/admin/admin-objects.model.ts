export interface HealthInfo {
    epoch: number;
    uptime: Array< number >;
    threads: number;
    runningThreads: number;
    javaVersion: string;
    hostname: string;
    runtime: {
        availableProcessors: number;
        freeMemory:number;
        totalMemory:number;
        maxMemory:number;
    };
    databaseInformation: Array< DatabaseInfo >;
    cacheInfo: {
        maxCacheElements: number;
        maxNotEvictableCacheElements: number;
        timeToLive: number;
        timeToIdle: number;
    };
}

export interface DatabaseInfo {
        database: string;
        driver: string;
        product: string;
        connected: boolean;
        latency: number;
}