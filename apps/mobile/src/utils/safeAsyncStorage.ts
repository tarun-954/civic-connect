// Simple in-memory AsyncStorage replacement to avoid native module issues.
// NOTE: This does NOT persist across app restarts – it only keeps data in memory
// for the current JS runtime session.

type Store = Record<string, string | null>;

const memoryStore: Store = {};

export interface ISafeAsyncStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

const SafeAsyncStorage: ISafeAsyncStorage = {
  async getItem(key: string) {
    return key in memoryStore ? memoryStore[key] ?? null : null;
  },
  async setItem(key: string, value: string) {
    memoryStore[key] = value;
  },
  async removeItem(key: string) {
    delete memoryStore[key];
  },
  async clear() {
    Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
  },
};

export default SafeAsyncStorage;

