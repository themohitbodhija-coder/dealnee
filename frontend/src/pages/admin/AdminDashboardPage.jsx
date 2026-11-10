import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/api';
import { FaBox, FaUsers, FaComment, FaTags } from 'react-icons/fa';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentProperties, setRecentProperties] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminService.getDashboardStats();
      setStats(response.data.stats);
      setRecentProperties(response.data.recentProperties);
      setRecentInquiries(response.data.recentInquiries);
    } catch (error) {
      setError('Unable to load the dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) return <p role="alert" className="p-8 text-red-700">{error}</p>;

  const StatCard = ({ icon: Icon, title, value, color, onClick }) => (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-4 cursor-pointer hover:shadow-xl hover:scale-105 transition duration-300 transform"
    >
      <div className={`p-4 rounded-full ${color}`}>
        <Icon className="text-3xl text-white" />
      </div>
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={FaBox}
          title="Total Properties"
          value={stats?.totalProperties || 0}
          color="bg-red-600"
          onClick={() => navigate('/admin/properties')}
        />
        <StatCard
          icon={FaUsers}
          title="Total Users"
          value={stats?.totalUsers || 0}
          color="bg-green-600"
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          icon={FaComment}
          title="Total Inquiries"
          value={stats?.totalInquiries || 0}
          color="bg-orange-600"
          onClick={() => navigate('/admin/inquiries')}
        />
        <StatCard
          icon={FaTags}
          title="Categories"
          value={stats?.totalCategories || 0}
          color="bg-purple-600"
          onClick={() => navigate('/admin/categories')}
        />
      </div>

      {/* New Inquiries Alert */}
      {stats?.newInquiries > 0 && (
        <div className="mb-8 p-4 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-300">
          <strong>{stats.newInquiries}</strong> new inquiries waiting for response
        </div>
      )}

      {/* Recent Properties */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Properties</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="pb-3 font-semibold text-gray-700">Title</th>
                <th className="pb-3 font-semibold text-gray-700">Category</th>
                <th className="pb-3 font-semibold text-gray-700">Price</th>
                <th className="pb-3 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentProperties.map((prop) => (
                <tr key={prop._id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{prop.title}</td>
                  <td className="py-3">{prop.category?.name}</td>
                  <td className="py-3">₹{prop.price?.toLocaleString?.()}</td>
                  <td className="py-3">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${
                      prop.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {prop.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Inquiries */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Inquiries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="pb-3 font-semibold text-gray-700">Name</th>
                <th className="pb-3 font-semibold text-gray-700">Email</th>
                <th className="pb-3 font-semibold text-gray-700">Property</th>
                <th className="pb-3 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInquiries.map((inquiry) => (
                <tr key={inquiry._id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{inquiry.name}</td>
                  <td className="py-3">{inquiry.email}</td>
                  <td className="py-3">{inquiry.property?.title || 'General'}</td>
                  <td className="py-3">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${
                      inquiry.status === 'new' ? 'bg-red-100 text-red-800' :
                      inquiry.status === 'read' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {inquiry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
