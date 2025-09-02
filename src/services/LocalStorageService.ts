class LocalStorageService {
  saveData(key: string, data: unknown): void {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
    } catch (error) {
      console.error(`Error saving data for key ${key}:`, error);
    }
  }

  getData<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const serializedData = localStorage.getItem(key);
      if (serializedData === null) {
        return defaultValue;
      }
      return JSON.parse(serializedData) as T;
    } catch (error) {
      console.error(`Error retrieving data for key ${key}:`, error);
      return defaultValue;
    }
  }

  removeData(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error);
    }
  }

  clearAll(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing all data:", error);
    }
  }
}

// Create a singleton instance
const localStorageService = new LocalStorageService();
export default localStorageService;