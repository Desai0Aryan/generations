const mem: Record<string, string> = {};
const AsyncStorage = {
  async getItem(k: string) { try { return window.localStorage.getItem(k); } catch { return mem[k] ?? null; } },
  async setItem(k: string, v: string) { try { window.localStorage.setItem(k, v); } catch { mem[k] = v; } },
  async removeItem(k: string) { try { window.localStorage.removeItem(k); } catch { delete mem[k]; } },
};
export default AsyncStorage;
