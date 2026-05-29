import React, { useState, useEffect } from 'react';
import api, { STATIC_BASE_URL } from '../api/api';
import { Plus, Search, Edit2, Trash2, X, Upload, Info } from 'lucide-react';

export default function ManageDishes() {
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toast, setToast] = useState(null); // { type: 'error'|'success', message: '' }

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null); // null if adding new
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [available, setAvailable] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      const [dishesRes, catRes] = await Promise.all([
        api.get('/menu'),
        api.get('/categories')
      ]);
      setDishes(dishesRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load menu dishes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingDish(null);
    setName('');
    setDescription('');
    setPrice('');
    setCategoryId(categories[0]?._id || '');
    setAvailable(true);
    setImageFile(null);
    setImagePreview('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (dish) => {
    setEditingDish(dish);
    setName(dish.name);
    setDescription(dish.description);
    setPrice(dish.price.toString());
    setCategoryId(dish.category_id);
    setAvailable(dish.available);
    setImageFile(null);
    setImagePreview(dish.image ? `${STATIC_BASE_URL}${dish.image}` : '');
    setFormError('');
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDeleteDish = async (dishId, dishName) => {
    setDeletingId(dishId);
    try {
      await api.delete(`/menu/${dishId}`);
      setDishes(prev => prev.filter(d => d._id !== dishId));
      showToast('success', `"${dishName}" removed from menu.`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete dish. It may not belong to your restaurant.';
      showToast('error', msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price.trim() || !categoryId) {
      setFormError('Name, Price, and Category are required.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('description', description.trim());
    formData.append('price', parseFloat(price));
    formData.append('category_id', categoryId);
    formData.append('available', available);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (editingDish) {
        // Edit dish
        const response = await api.put(`/menu/${editingDish._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setDishes(dishes.map(d => d._id === editingDish._id ? response.data : d));
        showToast('success', `"${name.trim()}" updated successfully.`);
      } else {
        // Add new dish
        const response = await api.post('/menu', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setDishes([...dishes, response.data]);
        showToast('success', `"${name.trim()}" added to menu.`);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving dish. Please check your category and try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || dish.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (catId) => {
    const found = categories.find(c => c._id === catId);
    return found ? found.name : 'Unknown';
  };

  if (loading) {
    return (
      <div className="py-12 text-center flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Loading catalog...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Toast Notification */}
      {toast && (
        <div className={`flex items-center justify-between px-4 py-3 text-xs uppercase tracking-wider font-bold border animate-fade-in ${
          toast.type === 'success'
            ? 'bg-black text-white border-black'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-4 opacity-60 hover:opacity-100 transition-opacity text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Top Header controls */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-neutral-200 pb-4">
        <h2 className="text-xs uppercase tracking-widest font-bold">Manage Menu Items ({dishes.length})</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative max-w-xs flex-grow">
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-neutral-300 focus:border-black pl-8 pr-4 py-1.5 text-xs rounded-none focus:outline-none transition-colors"
            />
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-400" />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-neutral-300 focus:border-black py-1.5 px-3 text-xs rounded-none focus:outline-none transition-colors font-semibold"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          {/* Add Button */}
          <button
            onClick={openAddModal}
            className="bg-black hover:bg-neutral-900 border border-black text-white px-4 py-1.5 text-xs uppercase tracking-widest font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Dish
          </button>
        </div>
      </div>

      {/* Dishes Table */}
      {filteredDishes.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-200">
          <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold">No dishes found in menu</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-semibold">
                <th className="p-4 font-bold">Image</th>
                <th className="p-4 font-bold">Name</th>
                <th className="p-4 font-bold">Category</th>
                <th className="p-4 font-bold">Price</th>
                <th className="p-4 font-bold">Availability</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDishes.map((dish) => (
                <tr key={dish._id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4">
                    <div className="w-12 h-12 bg-neutral-100 border border-neutral-200 overflow-hidden relative">
                      {dish.image ? (
                        <img src={`${STATIC_BASE_URL}${dish.image}`} alt={dish.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Info className="w-4 h-4 text-neutral-300" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-black uppercase tracking-wide">{dish.name}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1 max-w-sm">{dish.description}</div>
                  </td>
                  <td className="p-4 text-neutral-500 font-semibold">{getCategoryName(dish.category_id)}</td>
                  <td className="p-4 font-bold text-black">₹{dish.price.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-[9px] uppercase tracking-wider border font-bold ${
                      dish.available 
                        ? 'border-neutral-400 text-neutral-800 bg-neutral-50' 
                        : 'border-red-200 text-red-700 bg-red-50'
                    }`}>
                      {dish.available ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2.5">
                      <button
                        onClick={() => openEditModal(dish)}
                        className="border border-neutral-200 hover:border-black p-1.5 transition-colors"
                        title="Edit Dish"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-neutral-500 hover:text-black" />
                      </button>
                      <button
                        onClick={() => handleDeleteDish(dish._id, dish.name)}
                        disabled={deletingId === dish._id}
                        className="border border-neutral-200 hover:border-red-300 hover:bg-red-50 p-1.5 transition-colors disabled:opacity-40"
                        title="Delete Dish"
                      >
                        {deletingId === dish._id
                          ? <div className="w-3.5 h-3.5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5 text-neutral-500" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white border border-neutral-300 w-full max-w-lg flex flex-col relative animate-slide-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
              <h3 className="text-xs uppercase tracking-widest font-bold">
                {editingDish ? 'Modify Dish Entry' : 'Create New Dish Entry'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="border border-neutral-200 hover:border-black p-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
              {formError && (
                <div className="bg-black text-white p-3 text-xs uppercase tracking-wider font-bold">
                  {formError}
                </div>
              )}

              {/* Dish Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Dish Name</label>
                <input
                  type="text"
                  placeholder="e.g. Classic Margherita Pizza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white border border-neutral-300 focus:border-black p-2.5 text-xs rounded-none focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 14.50"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="bg-white border border-neutral-300 focus:border-black p-2.5 text-xs rounded-none focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Menu Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="bg-white border border-neutral-300 focus:border-black p-2.5 text-xs rounded-none focus:outline-none transition-colors font-semibold"
                    required
                  >
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Description</label>
                <textarea
                  placeholder="Describe ingredients, cooking details, or sizes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="bg-white border border-neutral-300 focus:border-black p-2.5 text-xs rounded-none focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Availability */}
              <div className="flex items-center gap-3 bg-neutral-50 p-3 border border-neutral-200">
                <input
                  type="checkbox"
                  id="availableToggle"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="w-4 h-4 accent-black cursor-pointer"
                />
                <label htmlFor="availableToggle" className="text-xs font-bold uppercase tracking-wider cursor-pointer">
                  Item is Active & Available for Orders
                </label>
              </div>

              {/* Image Upload */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Dish Image Graphic</label>
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 bg-neutral-100 border border-neutral-300 overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-grow flex flex-col gap-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      id="fileInput"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="fileInput"
                      className="border border-neutral-300 hover:border-black text-center text-[10px] uppercase tracking-widest font-bold py-2 px-4 cursor-pointer transition-colors block"
                    >
                      Choose Image File
                    </label>
                    <span className="text-[9px] text-neutral-400">PNG, JPG, JPEG, or WEBP up to 5MB.</span>
                  </div>
                </div>
              </div>

              {/* Submit buttons */}
              <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-neutral-200 hover:border-black text-xs uppercase tracking-widest font-bold px-5 py-2.5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-black hover:bg-neutral-900 border border-black text-white text-xs uppercase tracking-widest font-bold px-6 py-2.5 transition-colors flex items-center gap-2"
                >
                  {formSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Save Dish Entry'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
