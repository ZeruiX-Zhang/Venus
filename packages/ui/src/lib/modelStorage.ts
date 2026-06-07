// 用途：把用户上传的 3D 模型（GLB 二进制）持久化到 IndexedDB。
// 为什么用 IndexedDB 而不是 localStorage：
//   - localStorage 只能存字符串，且上限约 5MB；GLB 动辄几 MB，转 base64 还会膨胀 ~33%
//   - IndexedDB 能直接存二进制 Blob，容量大得多，是浏览器里存大文件的标准方案

const DB_NAME = "venus-models"; // 数据库名
const STORE_NAME = "models"; // 对象仓库（类似一张表）
const MODEL_KEY = "custom-model"; // 当前自定义模型的固定 key（只存一个）

// 打开（或首次创建）数据库。IndexedDB 的 API 是基于事件的，这里用 Promise 包一层方便 async/await
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    // 首次创建或版本升级时触发，用来建表
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 保存模型 Blob 到 IndexedDB
export async function saveCustomModel(blob: Blob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(blob, MODEL_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

// 读取已保存的模型 Blob；没有则返回 null
export async function loadCustomModel(): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(MODEL_KEY);
    request.onsuccess = () => {
      db.close();
      const result = request.result as Blob | undefined;
      resolve(result ?? null);
    };
    request.onerror = () => reject(request.error);
  });
}

// 删除已保存的模型（用户想换回默认模型时用）
export async function clearCustomModel(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(MODEL_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}
