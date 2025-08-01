import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';

export default function InventoryModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: '',
    supplier: '',
    location: '',
    expiry_date: '',
    min_stock: '',
    cost_per_unit: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || '',
        quantity: initialData.quantity || '',
        unit: initialData.unit || '',
        supplier: initialData.supplier || '',
        location: initialData.location || '',
        expiry_date: initialData.expiry_date ? initialData.expiry_date.split('T')[0] : '',
        min_stock: initialData.min_stock || '',
        cost_per_unit: initialData.cost_per_unit || ''
      });
    } else {
      setFormData({
        name: '',
        category: '',
        quantity: '',
        unit: '',
        supplier: '',
        location: '',
        expiry_date: '',
        min_stock: '',
        cost_per_unit: ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Inventory Item' : 'Add Inventory Item'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category"
            required
            value={formData.category}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
          >
            <option value="">Select Category</option>
            <option value="medication">Medication</option>
            <option value="medical_supplies">Medical Supplies</option>
            <option value="equipment">Equipment</option>
            <option value="consumables">Consumables</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              name="quantity"
              required
              value={formData.quantity}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Unit</label>
            <select
              name="unit"
              required
              value={formData.unit}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
            >
              <option value="">Select Unit</option>
              <option value="tablets">Tablets</option>
              <option value="boxes">Boxes</option>
              <option value="bottles">Bottles</option>
              <option value="packs">Packs</option>
              <option value="units">Units</option>
              <option value="ml">ml</option>
              <option value="mg">mg</option>
              <option value="g">g</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Supplier</label>
          <input
            type="text"
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
          <input
            type="date"
            name="expiry_date"
            value={formData.expiry_date}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Minimum Stock</label>
          <input
            type="number"
            name="min_stock"
            required
            value={formData.min_stock}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Cost Per Unit</label>
          <input
            type="number"
            name="cost_per_unit"
            required
            value={formData.cost_per_unit}
            onChange={handleChange}
            className="form-input mt-1 block w-full"
            min="0"
            step="0.01"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {initialData ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  );
}