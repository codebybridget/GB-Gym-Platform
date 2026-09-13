import { AsyncLocalStorage } from 'node:async_hooks'
export const tenantStorage = new AsyncLocalStorage()
export const getTenantContext = () => tenantStorage.getStore() || null
export const runTenantContext = (context, next) => tenantStorage.run(context, next)
