import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

/**
 * Kiểm tra môi trường Tauri có sẵn hay không
 */
function checkTauriEnvironment(): void {
    const hasWindow = typeof window !== 'undefined';
    const snapshot = {
        hasWindow,
        window__TAURI__: hasWindow ? (window as any).__TAURI__ : undefined,
        window__TAURI_IPC__: hasWindow ? (window as any).__TAURI_IPC__ : undefined,
        window__TAURI_INTERNALS__: hasWindow ? (window as any).__TAURI_INTERNALS__ : undefined,
        global__TAURI__: (globalThis as any).__TAURI__,
        global__TAURI_IPC__: (globalThis as any).__TAURI_IPC__,
        global__TAURI_INTERNALS__: (globalThis as any).__TAURI_INTERNALS__,
    };

    const tauriAvailable =
        snapshot.window__TAURI__ !== undefined ||
        snapshot.window__TAURI_IPC__ !== undefined ||
        snapshot.window__TAURI_INTERNALS__ !== undefined ||
        snapshot.global__TAURI__ !== undefined ||
        snapshot.global__TAURI_IPC__ !== undefined ||
        snapshot.global__TAURI_INTERNALS__ !== undefined;

    if (!tauriAvailable) {
        console.debug('Tauri detection snapshot:', snapshot);
        throw new Error(
            'Tauri runtime not detected. Run the app inside Tauri (npm run tauri dev) to use database features, or disable DB features for web dev. Detection snapshot: ' +
            JSON.stringify(snapshot)
        );
    }
}

/**
 * Khởi tạo kết nối database SQLite
 * Database sẽ được tạo tại thư mục app data của ứng dụng
 */
export async function connectDatabase(): Promise<Database> {
    if (db) return db;

    checkTauriEnvironment();

    try {
        db = await Database.load('sqlite:entype.db');
    } catch (err: any) {
        const message = String(err);
        console.error('Database.load error:', err);
        if (message.includes('invoke') || message.includes('undefined')) {
            throw new Error(
                'Tauri SQL plugin failed to initialize. Make sure @tauri-apps/plugin-sql is enabled in src-tauri/tauri.conf.json and you run inside Tauri. Original: ' +
                message
            );
        }
        throw err;
    }

    return db;
}

/**
 * Lấy instance database hiện tại
 */
export async function getDatabase(): Promise<Database> {
    if (!db) {
        return await connectDatabase();
    }
    return db;
}

/**
 * Đóng kết nối database
 */
export async function closeDatabase(): Promise<void> {
    if (db) {
        await db.close();
        db = null;
    }
}
