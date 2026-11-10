import React, { useState, useEffect, useCallback } from 'react';
import { propertyService } from '../../services/api';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { usesSupabase } from '../../lib/backend';
import AddPropertyPage from '../../components/admin/AddPropertyPage';

const ManagePropertiesPage = () => {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPropertyForm, setShowAddPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await (usesSupabase
        ? propertyService.getAdminAll({ page, limit: 25 })
        : propertyService.getAll({ limit: 100 }));
      setTotalPages(Math.max(1, response.data.pages || 1));
      setProperties(response.data.properties);
    } catch (error) {
      setError('Unable to load properties. Please try again.');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        const property = properties.find(item => item._id === id);
        await propertyService.delete(id, { version: property?.version });
        alert('Property deleted successfully!');
        fetchProperties();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting property');
      }
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setShowAddPropertyForm(true);
  };

  const handleEditComplete = () => {
    setShowAddPropertyForm(false);
    setEditingProperty(null);
    fetchProperties();
  };

  const handleAddComplete = () => {
    setShowAddPropertyForm(false);
    setEditingProperty(null);
    fetchProperties();
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Properties</h1>
        <button
          onClick={() => {
            setEditingProperty(null);
            setShowAddPropertyForm(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          <FaPlus /> <span>Add Property</span>
        </button>
      </div>

      {/* New Multi-Step Add Property Form */}
      {showAddPropertyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center pt-8 pb-8">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <div className="sticky top-0 flex justify-between items-center p-4 border-b bg-white">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingProperty ? 'Edit Property' : 'Add New Property'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddPropertyForm(false);
                    setEditingProperty(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              {/* Form Content */}
              <div className="p-8">
                <AddPropertyPage 
                  editingProperty={editingProperty}
                  onEditComplete={handleEditComplete}
                  onAddComplete={handleAddComplete}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
      {/* Properties List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr className="text-left">
                <th className="px-6 py-3 font-semibold text-gray-700">Property ID</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Title</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Property Type</th>
                <th className="px-6 py-3 font-semibold text-gray-700">City</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 font-semibold text-gray-800">{property.propertyId || '-'}</td>
                  <td className="px-6 py-3">{property.title}</td>
                  <td className="px-6 py-3">{property.propertyType || '-'}</td>
                  <td className="px-6 py-3">{property.location?.city}</td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${
                      property.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {property.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 flex space-x-2">
                    <button
                                  onClick={() => handleEdit(property)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaEdit />
                    </button>
                    <button
                                  onClick={() => handleDelete(property._id)}
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
      {usesSupabase && totalPages > 1 && <nav aria-label="Property pages" className="flex gap-4 mt-6 items-center">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="border rounded px-4 py-2 disabled:opacity-50">Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="border rounded px-4 py-2 disabled:opacity-50">Next</button>
      </nav>}
    </div>
  );
};

export default ManagePropertiesPage;
