import type { Module } from './types';

const MODULE_CACHE_TTL_MS = 5 * 60 * 1000;

class MenuCacheService {
  private modules: Module[] = [];
  private modulesLoadedAt = 0;
  private modulesRequest: Promise<Module[]> | null = null;

  getModules(): Module[] {
    if (!this.modulesLoadedAt) {
      return [];
    }

    const isExpired = Date.now() - this.modulesLoadedAt > MODULE_CACHE_TTL_MS;
    if (isExpired) {
      this.modules = [];
      this.modulesLoadedAt = 0;
      return [];
    }

    return this.modules;
  }

  setModules(modules: Module[]): void {
    this.modules = Array.isArray(modules) ? modules : [];
    this.modulesLoadedAt = Date.now();
  }

  async getOrLoadModules(loader: () => Promise<Module[]>): Promise<Module[]> {
    const cachedModules = this.getModules();
    if (cachedModules.length > 0) {
      return cachedModules;
    }

    if (this.modulesRequest) {
      return this.modulesRequest;
    }

    this.modulesRequest = loader()
      .then((modules) => {
        this.setModules(modules);
        return this.modules;
      })
      .finally(() => {
        this.modulesRequest = null;
      });

    return this.modulesRequest;
  }

  invalidateModules(): void {
    this.modules = [];
    this.modulesLoadedAt = 0;
    this.modulesRequest = null;
  }
}

export const menuCacheService = new MenuCacheService();
