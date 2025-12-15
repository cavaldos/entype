import { useEffect, useState } from 'react';
import {
    initDatabase,
    createUser,
    getAllUsers,
    deleteUser
} from '../service/database';

interface User {
    id?: number;
    name: string;
    email: string;
    created_at?: string;
}

function DatabaseExample() {
    const [users, setUsers] = useState<User[]>([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Khởi tạo database và load users
    useEffect(() => {
        const init = async () => {
            try {
                await initDatabase();
                await loadUsers();
            } catch (err: any) {
                const msg = String(err);
                // If the error contains a detection snapshot, display it to help debugging
                if (msg.includes('Detection snapshot:')) {
                    setError(`Lỗi khởi tạo database: ${msg}`);
                } else if (msg.includes('Tauri runtime not detected')) {
                    setError('Không tìm thấy Tauri runtime. Hãy chạy app bằng "npm run tauri dev" và dùng cửa sổ ứng dụng (không mở localhost trong trình duyệt).');
                } else if (msg.includes('Tauri SQL plugin failed to initialize')) {
                    setError('Lỗi khởi tạo plugin SQL của Tauri. Kiểm tra `@tauri-apps/plugin-sql` đã được kích hoạt trong `src-tauri/tauri.conf.json` và chạy app bằng Tauri.');
                } else {
                    setError(`Lỗi khởi tạo database: ${msg}`);
                }
                // Log full error for debugging
                console.error('initDatabase error:', err);
            }
        };
        init();
    }, []);

    // Load danh sách users
    const loadUsers = async () => {
        try {
            setLoading(true);
            const userList = await getAllUsers();
            setUsers(userList);
        } catch (err) {
            setError(`Lỗi load users: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    // Thêm user mới
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email) {
            setError('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await createUser(name, email);
            setName('');
            setEmail('');
            await loadUsers();
        } catch (err) {
            setError(`Lỗi thêm user: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    // Xóa user
    const handleDeleteUser = async (id: number) => {
        try {
            setLoading(true);
            await deleteUser(id);
            await loadUsers();
        } catch (err) {
            setError(`Lỗi xóa user: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">SQLite Database Example</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Form thêm user */}
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
                <h2 className="text-xl font-bold mb-4">Thêm User Mới</h2>
                <form onSubmit={handleAddUser}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Tên
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Nhập tên"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Nhập email"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                    >
                        {loading ? 'Đang xử lý...' : 'Thêm User'}
                    </button>
                </form>
            </div>

            {/* Danh sách users */}
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
                <h2 className="text-xl font-bold mb-4">Danh Sách Users ({users.length})</h2>
                {loading && <p className="text-gray-600">Đang tải...</p>}
                {users.length === 0 && !loading ? (
                    <p className="text-gray-600">Chưa có user nào</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-4 py-2 text-left">ID</th>
                                    <th className="px-4 py-2 text-left">Tên</th>
                                    <th className="px-4 py-2 text-left">Email</th>
                                    <th className="px-4 py-2 text-left">Ngày tạo</th>
                                    <th className="px-4 py-2 text-left">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-2">{user.id}</td>
                                        <td className="px-4 py-2">{user.name}</td>
                                        <td className="px-4 py-2">{user.email}</td>
                                        <td className="px-4 py-2">
                                            {user.created_at ? new Date(user.created_at).toLocaleString('vi-VN') : ''}
                                        </td>
                                        <td className="px-4 py-2">
                                            <button
                                                onClick={() => user.id && handleDeleteUser(user.id)}
                                                disabled={loading}
                                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50"
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DatabaseExample;
