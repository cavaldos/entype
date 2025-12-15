import { getDatabase } from './db-connection';

/**
 * Tạo các bảng và ràng buộc quan hệ
 */
export async function createTables(): Promise<void> {
    const db = await getDatabase();

    // Tạo bảng users
    await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Thêm các bảng khác và ràng buộc quan hệ ở đây nếu cần
}

/**
 * Seed dữ liệu mẫu vào database
 */
export async function seedInitialData(): Promise<void> {
    const db = await getDatabase();

    // Kiểm tra xem đã có user nào chưa
    const countRes = await db.select<{ count: number }[]>(
        'SELECT COUNT(*) as count FROM users'
    );
    const count = countRes && countRes.length > 0 ? (countRes[0].count as number) : 0;

    if (count === 0) {
        await db.execute('INSERT INTO users (name, email) VALUES ($1, $2)', [
            'Alice Smith',
            'alice@example.com'
        ]);
        await db.execute('INSERT INTO users (name, email) VALUES ($1, $2)', [
            'Bob Nguyen',
            'bob@example.com'
        ]);
        await db.execute('INSERT INTO users (name, email) VALUES ($1, $2)', [
            'Charlie Tran',
            'charlie@example.com'
        ]);
    }
}

/**
 * Khởi tạo schema và seed dữ liệu ban đầu
 */
export async function initializeSchema(): Promise<void> {
    await createTables();
    await seedInitialData();
}
