import React, { useState, useEffect } from 'react';
import { usesSupabase } from '../../lib/backend';
import { categoryService } from '../../services/api';
import { FaEdit, FaTrash, FaPlus, FaChevronDown, FaChevronRight, FaFolder, FaFile } from 'react-icons/fa';

const ManageCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentCategory: 'none',
  });
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const editingCategory = categories.find(c => c._id === editingId);
  const parentValue = category => usesSupabase ? category._id : category.name;
  const categoriesById = new Map(categories.map(category => [category._id, category]));
  const parentOptions = categories.filter(category => {
    if (!usesSupabase) return !category.parentCategory || category.parentCategory === 'none';
    let current = category;
    const visited = new Set();
    while (current) {
      if (current._id === editingId || visited.has(current._id)) return false;
      visited.add(current._id);
      current = categoriesById.get(current.parentCategory);
    }
    return true;
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setError('');
      const response = await categoryService.getAll();
      setCategories(response.data.categories);

      // Initialize expanded state for all main categories
      const mainCategories = response.data.categories.filter(cat =>
        !cat.parentCategory || cat.parentCategory === 'none' || cat.parentCategory === ''
      );

      const expanded = {};
      mainCategories.forEach(cat => {
        expanded[cat._id] = true; // Expand all by default
      });
      setExpandedCategories(expanded);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Unable to load categories.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter category name!');
      return;
    }


    setBusy(true);
    setError('');
    try {
      if (editingId) {
        await categoryService.update(editingId, formData);
        alert('✅ Category updated successfully!');
      } else {
        await categoryService.create(formData);
        alert('✅ Category created successfully!');
      }

      setFormData({ name: '', description: '', parentCategory: 'none' });
      setShowForm(false);
      setEditingId(null);
      await fetchCategories();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Unable to save category.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (busy) return;
    if (window.confirm('Are you sure you want to delete this category?')) {
      setBusy(true);
      setError('');
      try {
        await categoryService.delete(id);
        alert('✅ Category deleted successfully!');
        await fetchCategories();
      } catch (error) {
        setError(error.response?.data?.message || error.message || 'Unable to delete category.');
      } finally {
        setBusy(false);
      }
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      parentCategory: category.parentCategory || 'none',
    });
    setEditingId(category._id);
    setShowForm(true);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Get main categories and their subcategories
  const getMainCategories = () => {
    const mainCats = categories.filter(cat => {
      // Include if parentCategory is null, undefined, or empty string, or 'none'
      return !cat.parentCategory || cat.parentCategory === 'none' || cat.parentCategory === '';
    });
    return mainCats;
  };

  const getSubCategories = (parentName) => {
    return categories.filter(cat => cat.parentCategory === parentName);
  };

  // Category Tree Item Component
  const CategoryTreeItem = ({ category, level = 0 }) => {
    const subcategories = getSubCategories(parentValue(category));
    const hasSubcategories = subcategories.length > 0;
    const isExpanded = expandedCategories[category._id];

    return (
      <div key={category._id}>
        <div className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition ${
          level === 0 ? 'bg-blue-50 border-l-4 border-blue-500 font-semibold' : 'bg-gray-50'
        }`} style={{ marginLeft: `${level * 24}px` }}>

          {/* Expand/Collapse Icon */}
          {hasSubcategories ? (
            <button
              onClick={() => toggleCategory(category._id)}
              className="text-gray-600 hover:text-gray-800 transition p-1"
            >
              {isExpanded ? (
                <FaChevronDown className="text-lg" />
              ) : (
                <FaChevronRight className="text-lg" />
              )}
            </button>
          ) : (
            <div className="w-6"></div>
          )}

          {/* Folder/File Icon */}
          <div className="text-xl">
            {level === 0 ? (
              <FaFolder className="text-blue-600" />
            ) : (
              <FaFile className="text-green-600" />
            )}
          </div>

          {/* Category Name */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <p className="text-gray-800">{category.name}</p>
              {level === 0 && (
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-semibold">Main</span>
              )}
              {level > 0 && (
                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-semibold">Sub</span>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-gray-600 mt-1">{category.description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              disabled={busy}
              onClick={() => handleEdit(category)}
              className="p-2 text-blue-600 hover:bg-blue-200 rounded transition"
              title="Edit"
            >
              <FaEdit size={16} />
            </button>
            <button
              disabled={busy || category.is_system}
              onClick={() => handleDelete(category._id)}
              className="p-2 text-red-600 hover:bg-red-200 rounded transition"
              title={category.is_system ? "Built-in categories cannot be deleted" : "Delete"}
            >
              <FaTrash size={16} />
            </button>
          </div>
        </div>

        {/* Subcategories */}
        {hasSubcategories && isExpanded && (
          <div className="space-y-1">
            {subcategories.map(subcat => (
              <CategoryTreeItem key={subcat._id} category={subcat} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Manage Categories</h1>
          <p className="text-gray-600">Organize your property categories in a hierarchical structure</p>
        </div>
        <div className="flex space-x-2">
          <button
            disabled={busy}
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ name: '', description: '', parentCategory: 'none' });
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-md"
          >
            <FaPlus /> <span>Add Category</span>
          </button>
        </div>
      </div>

      {error && <div role="alert" className="mb-4 p-4 bg-red-50 text-red-700 rounded">{error}</div>}
      {usesSupabase && <p className="mb-4 text-gray-600">Built-in category names and descriptions can be edited. Their codes and hierarchy are fixed.</p>}
      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-2 border-green-300">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingId ? '✏️ Edit Category' : '➕ Add New Category'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={busy} className="space-y-4">
            <div>
              <label htmlFor="category-name" className="block text-gray-700 font-semibold mb-2">Category Name *</label>
              <input
                type="text"
                id="category-name"
                maxLength={120}
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                placeholder="e.g., Buy Property, Apartment, Villa"
              />
            </div>

            <div>
              <label htmlFor="category-parent" className="block text-gray-700 font-semibold mb-2">Parent Category</label>
              <select
                id="category-parent"
                disabled={usesSupabase && !!editingCategory?.is_system}
                name="parentCategory"
                value={formData.parentCategory || 'none'}
                onChange={handleInputChange}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500 bg-white"
              >
                <option value="none">None (Main Category)</option>
                {parentOptions.map(cat => (
                  <option key={cat._id} value={parentValue(cat)}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category-description" className="block text-gray-700 font-semibold mb-2">Description (Optional)</label>
              <textarea
                id="category-description"
                maxLength={2000}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                placeholder="Enter description"
              ></textarea>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold shadow-md"
              >
                {editingId ? 'Update Category' : 'Create Category'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ name: '', description: '', parentCategory: 'none' });
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold shadow-md"
              >
                Cancel
              </button>
            </div>
            </fieldset>
          </form>
        </div>
      )}

      {/* Categories Hierarchical Tree */}
      {categories.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Category Hierarchy ({categories.length})</h2>

          {getMainCategories().length > 0 ? (
            <div className="space-y-2">
              {getMainCategories().map(category => (
                <CategoryTreeItem key={category._id} category={category} level={0} />
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
              <p className="text-yellow-800 font-semibold mb-2">⚠️ No main categories found</p>
              <p className="text-yellow-700 text-sm mb-4">Debug: Total categories in database: {categories.length}</p>
              <p className="text-yellow-700 text-sm">Make sure to create main categories without a parent category.</p>
            </div>
          )}
        </div>
      )}

      {categories.length === 0 && !loading && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-8 text-center">
          <p className="text-lg text-blue-800 font-semibold">📁 No categories yet</p>
          <p className="text-blue-700">Click "➕ Add Category" to create your first category</p>
        </div>
      )}
    </div>
  );
};

export default ManageCategoriesPage;
