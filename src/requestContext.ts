import { AsyncLocalStorage } from "node:async_hooks";

export interface GhostRequestContext {
    adminApiKey?: string;
    apiVersion?: string;
}

const ghostRequestContext = new AsyncLocalStorage<GhostRequestContext>();

export function runWithGhostRequestContext<T>(
    context: GhostRequestContext,
    fn: () => Promise<T>
): Promise<T> {
    return ghostRequestContext.run(context, fn);
}

export function getGhostRequestContext(): GhostRequestContext | undefined {
    return ghostRequestContext.getStore();
}