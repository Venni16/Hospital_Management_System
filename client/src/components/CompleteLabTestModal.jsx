import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';

export default function CompleteLabTestModal({ isOpen, onClose, labTest, onComplete, loading, error }) {
  const [results, setResults] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (labTest) {
      setResults(labTest.results || '');
      setNotes(labTest.notes || '');
    }
  }, [labTest]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!results.trim()) {
      alert('Please enter test results.');
      return;
    }
    onComplete(labTest.id, results, notes);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Lab Test" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Test Type</label>
          <p className="mt-1 text-gray-900">{labTest.test_type}</p>
        </div>

        <div>
          <label htmlFor="results" className="block text-sm font-medium text-gray-700">
            Results <span className="text-red-500">*</span>
          </label>
          <textarea
            id="results"
            name="results"
            rows={4}
            required
            value={results}
            onChange={(e) => setResults(e.target.value)}
            className="form-input mt-1 block w-full"
            placeholder="Enter test results"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-input mt-1 block w-full"
            placeholder="Additional notes (optional)"
            disabled={loading}
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Completing...' : 'Complete Test'}
          </button>
        </div>
      </form>
    </Modal>
  );
}