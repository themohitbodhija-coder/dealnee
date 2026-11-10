import React, { useState, useEffect } from 'react';
import { inquiryService } from '../../services/api';
import { FaEye, FaTrash } from 'react-icons/fa';

const ManageInquiriesPage = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  useEffect(() => {
    fetchInquiries();
  }, [page]);

  const fetchInquiries = async () => {
    try {
      const response = await inquiryService.getAll({ page, limit: 10 });
      setInquiries(response.data.inquiries);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this inquiry?')) {
      try {
        await inquiryService.delete(id);
        alert('Inquiry deleted successfully!');
        fetchInquiries();
      } catch (error) {
        alert('Error deleting inquiry');
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await inquiryService.updateStatus(id, { status });
      alert('Status updated successfully!');
      fetchInquiries();
    } catch (error) {
      alert('Error updating status');
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
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Inquiries</h1>

      {/* Inquiries Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr className="text-left">
                <th className="px-6 py-3 font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Property</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr key={inquiry._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">{inquiry.name}</td>
                  <td className="px-6 py-3">{inquiry.email}</td>
                  <td className="px-6 py-3">{inquiry.property?.title || 'General'}</td>
                  <td className="px-6 py-3">
                    <select
                      value={inquiry.status}
                      onChange={(e) => handleStatusChange(inquiry._id, e.target.value)}
                      className={`px-3 py-1 rounded text-xs font-semibold border-0 ${
                        inquiry.status === 'new' ? 'bg-red-100 text-red-800' :
                        inquiry.status === 'read' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}
                    >
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="replied">Replied</option>
                    </select>
                  </td>
                  <td className="px-6 py-3">{new Date(inquiry.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3 flex space-x-2">
                    <button
                      onClick={() => setSelectedInquiry(inquiry)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleDelete(inquiry._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
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

      {/* Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Inquiry Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm">Name</p>
                <p className="text-gray-800 font-semibold">{selectedInquiry.name}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Email</p>
                <p className="text-gray-800 font-semibold">{selectedInquiry.email}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Phone</p>
                <p className="text-gray-800 font-semibold">{selectedInquiry.phone || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Message</p>
                <p className="text-gray-800 font-semibold">{selectedInquiry.message}</p>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInquiriesPage;
