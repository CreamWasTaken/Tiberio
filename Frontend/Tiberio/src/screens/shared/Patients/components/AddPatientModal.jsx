import React, { useState, useEffect } from 'react';
import { checkDuplicatePatient } from '../../../../services/patient';

function AddPatientModal({
  isOpen,
  onClose,
  form,
  setForm,
  formError,
  isSubmitting,
  onSubmit
}) {
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Check for duplicates when form fields change
  useEffect(() => {
    const checkForDuplicates = async () => {
      if (form.first_name && form.last_name && form.birthdate) {
        setIsCheckingDuplicate(true);
        try {
          const result = await checkDuplicatePatient(
            form.first_name.trim(),
            form.last_name.trim(),
            form.birthdate
          );
          
          if (result.isDuplicate) {
            setDuplicateWarning(result.duplicatePatient);
          } else {
            setDuplicateWarning(null);
          }
        } catch (error) {
          console.error('Error checking for duplicates:', error);
          setDuplicateWarning(null);
        } finally {
          setIsCheckingDuplicate(false);
        }
      } else {
        setDuplicateWarning(null);
      }
    };

    // Debounce the duplicate check
    const timeoutId = setTimeout(checkForDuplicates, 500);
    return () => clearTimeout(timeoutId);
  }, [form.first_name, form.last_name, form.birthdate]);

  // Clear duplicate warning when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDuplicateWarning(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col">
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-t-xl border border-gray-700 p-3 flex items-center justify-between flex-shrink-0">
          <h2 className="text-medium font-semibold text-white">Add New Patient</h2>
          <button className="text-blue-100 hover:text-white" onClick={onClose} aria-label="Close add form">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="bg-gray-800 border-x border-b border-gray-700 rounded-b-xl p-2 overflow-y-auto flex-1">
          {formError && (
            <div className="mb-4 text-sm text-red-400">{formError}</div>
          )}
          
          {/* Duplicate Warning */}
          {duplicateWarning && (
            <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-400 mb-2">
                    Potential Duplicate Patient Found
                  </h3>
                  <p className="text-sm text-yellow-200 mb-3">
                    A patient with the same name and birthdate already exists:
                  </p>
                  <div className="bg-gray-800/50 rounded p-3 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-400">Name:</span>
                        <span className="text-white ml-2">{duplicateWarning.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Birthdate:</span>
                        <span className="text-white ml-2">
                          {duplicateWarning.birthdate ? new Date(duplicateWarning.birthdate).toISOString().split('T')[0] : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Contact:</span>
                        <span className="text-white ml-2">{duplicateWarning.contact}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Address:</span>
                        <span className="text-white ml-2">{duplicateWarning.address || '—'}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-yellow-300 mt-2">
                    Please verify if this is the same patient or if you want to create a new record.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Checking for duplicates indicator */}
          {isCheckingDuplicate && (
            <div className="mb-4 flex items-center gap-2 text-sm text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              Checking for existing patients...
            </div>
          )}
          <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">First Name</label>
              <input className="w-full px-2 py-1 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Middle Initial</label>
              <input className="w-full px-3 py-1 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                value={form.middle_name}
                maxLength={1} 
                onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Last Name</label>
              <input className="w-full px-3 py-1 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Sex</label>
              <select className="w-full px-3 py-1 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                value={form.sex}
                onChange={(e) => setForm({ ...form, sex: e.target.value })}
                required
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Birthdate</label>
              <input type="date" className="w-full px-3 py-1 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                value={form.birthdate}
                onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-300 mb-1">Address</label>
              <input className="w-full px-3 py-1 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Contact Number</label>
              <input className="w-full px-3 py-1 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                type="tel"
                maxLength={10}
                placeholder="09XXXXXXXXX"
                value={form.contact_number}
                onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Telephone Number</label>
              <input className="w-full px-3 py-1 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                type="tel"
                value={form.telephone_number}
                onChange={(e) => setForm({ ...form, telephone_number: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Senior Number</label>
              <input className="w-full px-3 py-1 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                value={form.senior_number}
                onChange={(e) => setForm({ ...form, senior_number: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" className="px-4 py-2 bg-gray-700 text-white rounded-lg" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button 
                type="submit" 
                className={`px-4 py-2 text-white rounded-lg transition-colors duration-200 ${
                  duplicateWarning 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                disabled={isSubmitting || isCheckingDuplicate}
              >
                {isSubmitting ? 'Saving...' : duplicateWarning ? 'Save Anyway' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddPatientModal;


