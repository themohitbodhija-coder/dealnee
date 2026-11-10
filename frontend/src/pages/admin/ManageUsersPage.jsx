import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { FaTrash } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      const response = await adminService.getAllUsers({ page, limit: 10 });
      setUsers(response.data.users);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminService.deleteUser(id);
        alert('User deleted successfully!');
        fetchUsers();
      } catch (error) {
        alert('Error deleting user');
      }
    }
  };

  // Add User Modal state
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user', permissions: [] });

  const PERMISSIONS = [
    { key: 'manage_properties', label: 'Manage Properties' },
    { key: 'manage_categories', label: 'Manage Categories' },
    { key: 'manage_users', label: 'Manage Users' },
    { key: 'view_inquiries', label: 'View Inquiries' },
  ];

  const togglePermission = (perm) => {
    setNewUser((prev) => {
      const exists = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: exists ? prev.permissions.filter((p) => p !== perm) : [...prev.permissions, perm]
      };
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await adminService.createUser(newUser);
      alert('User created successfully');
      setShowModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'user', permissions: [] });
      fetchUsers();
    } catch (error) {
      console.error('Create user error', error);
      alert('Error creating user');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Users</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded"
        >
          <FaPlus /> Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr className="text-left">
                <th className="px-6 py-3 font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Role</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Permissions</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Joined</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">{user.name}</td>
                  <td className="px-6 py-3">{user.email}</td>
                  <td className="px-6 py-3">{user.phone || '-'}</td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">{user.permissions && user.permissions.length ? user.permissions.join(', ') : '-'}</td>
                  <td className="px-6 py-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setPage(num)}
              className={`px-4 py-2 rounded ${
                page === num
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New User</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-600">Close</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  required
                  placeholder="Full Name"
                  value={newUser.name}
                  onChange={(e) => setNewUser((s) => ({ ...s, name: e.target.value }))}
                  className="border p-3 rounded"
                />
                <input
                  required
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((s) => ({ ...s, email: e.target.value }))}
                  className="border p-3 rounded"
                />
                <input
                  required
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser((s) => ({ ...s, password: e.target.value }))}
                  className="border p-3 rounded"
                />
                <select
                  value={newUser.role}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewUser((s) => ({ ...s, role: val, permissions: val === 'subadmin' ? s.permissions : [] }));
                  }}
                  className="border p-3 rounded"
                >
                  <option value="user">User</option>
                  <option value="subadmin">Sub-Admin</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {newUser.role === 'subadmin' && (
                <div>
                  <p className="font-semibold mb-2">Permissions</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {PERMISSIONS.map((p) => (
                      <label key={p.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newUser.permissions.includes(p.key)}
                          onChange={() => togglePermission(p.key)}
                        />
                        <span>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsersPage;
