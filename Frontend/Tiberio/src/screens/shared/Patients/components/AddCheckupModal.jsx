import React from 'react';

function AddCheckupModal({
  isOpen,
  onClose,
  checkupForm,
  setCheckupForm,
  checkupFormError,
  isSavingCheckup,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl mx-4 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-t-xl border border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Add Checkup</h2>
          <button className="text-blue-100 hover:text-white" onClick={onClose} aria-label="Close add form">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="bg-gray-800 border-x border-b border-gray-700 rounded-b-xl p-4 overflow-y-auto custom-scrollbar">
          {checkupFormError && (
            <div className="mb-4 text-sm text-red-400">{checkupFormError}</div>
          )}
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 text-xs">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Checkup Date</label>
              <input type="date" className="w-full px-2 py-1.5 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                value={checkupForm.checkup_date}
                onChange={(e) => setCheckupForm({ ...checkupForm, checkup_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Diagnosis</label>
              <input className="w-full px-2 py-1.5 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                value={checkupForm.diagnosis}
                onChange={(e) => setCheckupForm({ ...checkupForm, diagnosis: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Notes</label>
              <textarea className="w-full px-2 py-1.5 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                rows={2}
                value={checkupForm.notes}
                onChange={(e) => setCheckupForm({ ...checkupForm, notes: e.target.value })}
              />
            </div>
            <div className="mt-2">
              <div className="text-white font-medium mb-1">Spectacle Prescription</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left border border-gray-700 table-fixed">
                  <thead className="bg-gray-900/70">
                    <tr>
                      <th className="px-2 py-1 border-b border-gray-700">Eye</th>
                      <th className="px-2 py-1 border-b border-gray-700">Sphere</th>
                      <th className="px-2 py-1 border-b border-gray-700">Cylinder</th>
                      <th className="px-2 py-1 border-b border-gray-700">Axis</th>
                      <th className="px-2 py-1 border-b border-gray-700">Addition</th>
                      <th className="px-2 py-1 border-b border-gray-700">Visual acuity</th>
                      <th className="px-2 py-1 border-b border-gray-700">MPD</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="odd:bg-gray-800/40">
                      <td className="px-2 py-1 border-t border-gray-700 text-gray-300">Right Eye</td>
                      <td className="px-2 py-1 border-t border-gray-700">
                        <input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.spectacle.sphereRight} onChange={(e) => setCheckupForm({ ...checkupForm, spectacle: { ...checkupForm.spectacle, sphereRight: e.target.value } })} />
                      </td>
                      <td className="px-2 py-1 border-t border-gray-700">
                        <input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.spectacle.cylinderRight} onChange={(e) => setCheckupForm({ ...checkupForm, spectacle: { ...checkupForm.spectacle, cylinderRight: e.target.value } })} />
                      </td>
                      <td className="px-2 py-1 border-t border-gray-700">
                        <input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.spectacle.axisRight} onChange={(e) => setCheckupForm({ ...checkupForm, spectacle: { ...checkupForm.spectacle, axisRight: e.target.value } })} />
                      </td>
                      <td className="px-2 py-1 border-t border-gray-700">
                        <input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.spectacle.additionRight} onChange={(e) => setCheckupForm({ ...checkupForm, spectacle: { ...checkupForm.spectacle, additionRight: e.target.value } })} />
                      </td>
                      <td className="px-2 py-1 border-t border-gray-700">
                        <input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.spectacle.visualAcuityRight} onChange={(e) => setCheckupForm({ ...checkupForm, spectacle: { ...checkupForm.spectacle, visualAcuityRight: e.target.value } })} />
                      </td>
                      <td className="px-2 py-1 border-t border-gray-700">
                        <input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.spectacle.monocularPdRight} onChange={(e) => setCheckupForm({ ...checkupForm, spectacle: { ...checkupForm.spectacle, monocularPdRight: e.target.value } })} />
                      </td>
                    </tr>
                    <tr className="odd:bg-gray-800/40">
                      <td className="px-2 py-1 border-t border-gray-700 text-gray-300">Left Eye</td>
                      <td className="px-2 py-1 border-t border-gray-700">
                        <input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.spectacle.sphereLeft} onChange={(e) => setCheckupForm({ ...checkupForm, spectacle: { ...checkupForm.spectacle, sphereLeft: e.target.value } })} />
                      </td>
                      <td className="px-2 py-1 border-t border-gray-700">
                        <input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.spectacle.cylinderLeft} onChange={(e) => setCheckupForm({ ...checkupForm, spectacle: { ...checkupForm.spectacle, cylinderLeft: e.target.value } })} />
                      </td>
                      <td className="px-2 py-1 border-t border-gray-700">
                        <input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.spectacle.axisLeft} onChange={(e) => setCheckupForm({ ...checkupForm, spectacle: { ...checkupForm.spectacle, axisLeft: e.target.value } })} />
                      </td>
                      <td className="px-2 py-1 border-t border-gray-700">
                        <input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.spectacle.additionLeft} onChange={(e) => setCheckupForm({ ...checkupForm, spectacle: { ...checkupForm.spectacle, additionLeft: e.target.value } })} />
                      </td>
                      <td className="px-2 py-1 border-t border-gray-700">
                        <input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.spectacle.visualAcuityLeft} onChange={(e) => setCheckupForm({ ...checkupForm, spectacle: { ...checkupForm.spectacle, visualAcuityLeft: e.target.value } })} />
                      </td>
                      <td className="px-2 py-1 border-t border-gray-700">
                        <input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.spectacle.monocularPdLeft} onChange={(e) => setCheckupForm({ ...checkupForm, spectacle: { ...checkupForm.spectacle, monocularPdLeft: e.target.value } })} />
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1 border-t border-gray-700 text-gray-300">BPD</td>
                      <td className="px-2 py-1 border-t border-gray-700" colSpan={6}>
                        <input className="w-full h-8 px-2 bg-gray-900/70 border border-gray-700 rounded text-white text-xs" value={checkupForm.binocular_pd} onChange={(e) => setCheckupForm({ ...checkupForm, binocular_pd: e.target.value })} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-white font-medium mb-1">Contact Lens Prescription</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left border border-gray-700 table-fixed">
                  <thead className="bg-gray-900/70">
                    <tr>
                      <th className="px-2 py-1 border-b border-gray-700">Eye</th>
                      <th className="px-2 py-1 border-b border-gray-700">Sphere</th>
                      <th className="px-2 py-1 border-b border-gray-700">Cylinder</th>
                      <th className="px-2 py-1 border-b border-gray-700">Axis</th>
                      <th className="px-2 py-1 border-b border-gray-700">Addition</th>
                      <th className="px-2 py-1 border-b border-gray-700">Base Curve</th>
                      <th className="px-2 py-1 border-b border-gray-700">Diameter</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="odd:bg-gray-800/40">
                      <td className="px-2 py-1 border-t border-gray-700 text-gray-300">Right Eye</td>
                      <td className="px-2 py-1 border-t border-gray-700"><input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.contact.sphereRight} onChange={(e) => setCheckupForm({ ...checkupForm, contact: { ...checkupForm.contact, sphereRight: e.target.value } })} /></td>
                      <td className="px-2 py-1 border-t border-gray-700"><input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.contact.cylinderRight} onChange={(e) => setCheckupForm({ ...checkupForm, contact: { ...checkupForm.contact, cylinderRight: e.target.value } })} /></td>
                      <td className="px-2 py-1 border-t border-gray-700"><input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.contact.axisRight} onChange={(e) => setCheckupForm({ ...checkupForm, contact: { ...checkupForm.contact, axisRight: e.target.value } })} /></td>
                      <td className="px-2 py-1 border-t border-gray-700"><input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.contact.additionRight} onChange={(e) => setCheckupForm({ ...checkupForm, contact: { ...checkupForm.contact, additionRight: e.target.value } })} /></td>
                      <td className="px-2 py-1 border-t border-gray-700"><input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.contact.baseCurveRight} onChange={(e) => setCheckupForm({ ...checkupForm, contact: { ...checkupForm.contact, baseCurveRight: e.target.value } })} /></td>
                      <td className="px-2 py-1 border-t border-gray-700"><input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.contact.diameterRight} onChange={(e) => setCheckupForm({ ...checkupForm, contact: { ...checkupForm.contact, diameterRight: e.target.value } })} /></td>
                    </tr>
                    <tr className="odd:bg-gray-800/40">
                      <td className="px-2 py-1 border-t border-gray-700 text-gray-300">Left Eye</td>
                      <td className="px-2 py-1 border-t border-gray-700"><input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.contact.sphereLeft} onChange={(e) => setCheckupForm({ ...checkupForm, contact: { ...checkupForm.contact, sphereLeft: e.target.value } })} /></td>
                      <td className="px-2 py-1 border-t border-gray-700"><input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.contact.cylinderLeft} onChange={(e) => setCheckupForm({ ...checkupForm, contact: { ...checkupForm.contact, cylinderLeft: e.target.value } })} /></td>
                      <td className="px-2 py-1 border-t border-gray-700"><input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.contact.axisLeft} onChange={(e) => setCheckupForm({ ...checkupForm, contact: { ...checkupForm.contact, axisLeft: e.target.value } })} /></td>
                      <td className="px-2 py-1 border-t border-gray-700"><input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.contact.additionLeft} onChange={(e) => setCheckupForm({ ...checkupForm, contact: { ...checkupForm.contact, additionLeft: e.target.value } })} /></td>
                      <td className="px-2 py-1 border-t border-gray-700"><input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.contact.baseCurveLeft} onChange={(e) => setCheckupForm({ ...checkupForm, contact: { ...checkupForm.contact, baseCurveLeft: e.target.value } })} /></td>
                      <td className="px-2 py-1 border-t border-gray-700"><input className="w-16 h-8 px-1 bg-gray-900/70 border border-gray-700 rounded text-white text-xs text-center" value={checkupForm.contact.diameterLeft} onChange={(e) => setCheckupForm({ ...checkupForm, contact: { ...checkupForm.contact, diameterLeft: e.target.value } })} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button type="button" className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-sm" onClick={onClose} disabled={isSavingCheckup}>Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm" disabled={isSavingCheckup}>{isSavingCheckup ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddCheckupModal;


