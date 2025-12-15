import { getDatabase } from './db-connection';

export interface User {
    id?: number;
    name: string;
    email: string;
    created_at?: string;
}

/**
 * Thêm user mới
 */
export async function createUser(name: string, email: string): Promise<void> {
    const database = await getDatabase();
    await database.execute(
        'INSERT INTO users (name, email) VALUES ($1, $2)',
        [name, email]
    );
}

/**
 * Lấy tất cả users
 */
export async function getAllUsers(): Promise<User[]> {
    const database = await getDatabase();
    const result = await database.select<User[]>('SELECT * FROM users ORDER BY created_at DESC');
    return result;
}

/**
 * Lấy user theo ID
 */
export async function getUserById(id: number): Promise<User | null> {
    const database = await getDatabase();
    const result = await database.select<User[]>(
        'SELECT * FROM users WHERE id = $1',
        [id]
    );
    return result.length > 0 ? result[0] : null;
}

/**
 * Cập nhật user
 */
export async function updateUser(id: number, name: string, email: string): Promise<void> {
    const database = await getDatabase();
    await database.execute(
        'UPDATE users SET name = $1, email = $2 WHERE id = $3',
        [name, email, id]
    );
}

/**
 * Xóa user
 */
export async function deleteUser(id: number): Promise<void> {
    const database = await getDatabase();
    await database.execute('DELETE FROM users WHERE id = $1', [id]);
}
