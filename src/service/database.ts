/**
 * File tổng hợp - Re-export từ các module con
 */

// Kết nối database
export { connectDatabase, getDatabase, closeDatabase } from './db-connection';

// Schema và khởi tạo bảng
export { createTables, seedInitialData, initializeSchema } from './db-schema';

// Operations (CRUD)
export {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    type User
} from './db-operations';

// Hàm khởi tạo database đầy đủ (kết nối + tạo bảng + seed)
import Database from '@tauri-apps/plugin-sql';
import { connectDatabase } from './db-connection';
import { initializeSchema } from './db-schema';

export async function initDatabase(): Promise<Database> {
    const db = await connectDatabase();
    await initializeSchema();
    return db;
}
