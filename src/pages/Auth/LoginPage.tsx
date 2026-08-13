import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../lib/types';
import { db } from '../../lib/database';
import { useAuthStore } from '../../stores/authStore';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await db.getUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error("Failed to load users", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleLogin = (user: User) => {
    login(user);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
            <span className="text-white text-3xl font-bold -rotate-3">H</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sales HHG
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Hệ thống Quản lý Bán hàng
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur-lg py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-white">
          <div className="mb-6 text-center">
            <h3 className="text-lg font-medium text-gray-900">Chọn tài khoản Demo để đăng nhập</h3>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleLogin(user)}
                  className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left group"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {user.full_name}
                    </span>
                    <span className="text-sm text-gray-500">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full 
                      ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 
                        user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {user.role}
                    </span>
                    <LogIn size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
