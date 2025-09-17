import React from 'react';

function AddPatientModal({
  isOpen,
  onClose,
  form,
  setForm,
  formError,
  isSubmitting,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto">
      <div className="absolute inset-0  bg-black/60" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl mx-2 shadow-2xl">
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-t-xl border border-gray-700 p-3 flex items-center justify-between">
          <h2 className="text-medium font-semibold text-white">Add New Patient</h2>
          <button className="text-blue-100 hover:text-white" onClick={onClose} aria-label="Close add form">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="bg-gray-800 border-x border-b border-gray-700 rounded-b-xl p-2">
          {formError && (
            <div className="mb-4 text-sm text-red-400">{formError}</div>
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
              <label className="block text-sm text-gray-300 mb-1">Middle Name</label>
              <input className="w-full px-3 py-1 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                value={form.middle_name}
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
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddPatientModal;


