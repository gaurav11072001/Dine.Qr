import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create state
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editingCat, setEditingCat] = useState(null);
  const [editName, setEditName] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setErrorMsg('');
    setSubmitting(true);
    try {
      const response = await api.post('/categories', { name: name.trim() });
      setCategories([...categories, response.data]);
      setName('');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (cat) => {
    setEditingCat(cat);
    setEditName(cat.name);
    setEditErrorMsg('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editingCat) return;

    setEditErrorMsg('');
    try {
      await api.put(`/categories/${editingCat._id}`, { name: editName.trim() });
      setCategories(categories.map(c => c._id === editingCat._id ? { ...c, name: editName.trim() } : c));
      setEditingCat(null);
    } catch (err) {
      setEditErrorMsg(err.response?.data?.message || 'Failed to update category');
    }
  };

  const handleDelete = async (catId, catName) => {
    if (!window.confirm(`CRITICAL WARNING:\nDeleting the category "${catName}" will automatically delete ALL dishes associated with it.\n\nAre you sure you want to proceed?`)) {
      return;
    }

    try {
      await api.delete(`/categories/${catId}`);
      setCategories(categories.filter(c => c._id !== catId));
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start animate-fade-in">
      
      {/* Category Creation Form */}
      <div className="md:col-span-1 border border-neutral-200 p-6 bg-white flex flex-col gap-4">
        <h3 className="text-xs uppercase tracking-widest font-bold border-b border-neutral-100 pb-3">Create Category</h3>
        
        {errorMsg && (
          <div className="bg-black text-white p-3 text-xs uppercase tracking-wider flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold font-sans">Category Name</label>
            <input
              type="text"
              placeholder="e.g. Starters, Desserts..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white border border-neutral-300 focus:border-black p-2.5 text-xs rounded-none focus:outline-none transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-black hover:bg-neutral-900 border border-black text-white py-2.5 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add Category
              </>
            )}
          </button>
        </form>
      </div>

      {/* Category List */}
      <div className="md:col-span-2 flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-widest font-bold border-b border-neutral-200 pb-3">
          Existing Menu Categories ({categories.length})
        </h2>

        {categories.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-neutral-200">
            <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold">No categories registered yet</p>
          </div>
        ) : (
          <div className="border border-neutral-200 bg-white">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="border-b border-neutral-100 p-4 flex justify-between items-center hover:bg-neutral-50/50 transition-colors last:border-none"
              >
                {editingCat && editingCat._id === cat._id ? (
                  /* Edit Mode inline Form */
                  <form onSubmit={handleSaveEdit} className="w-full flex flex-col gap-2">
                    {editErrorMsg && <span className="text-[10px] text-red-500 font-bold uppercase">{editErrorMsg}</span>}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-white border border-neutral-300 focus:border-black py-1.5 px-3 text-xs rounded-none focus:outline-none transition-colors flex-grow"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-black hover:bg-neutral-950 text-white text-[10px] uppercase tracking-widest font-bold px-4 py-1.5 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCat(null)}
                        className="border border-neutral-300 hover:border-black text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Read Mode */
                  <>
                    <span className="text-xs font-bold uppercase tracking-wider text-black">{cat.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="border border-neutral-200 hover:border-black p-1.5 transition-colors"
                        title="Edit Category Name"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-neutral-500 hover:text-black" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id, cat.name)}
                        className="border border-neutral-200 hover:border-black p-1.5 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-neutral-500 hover:text-black" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
