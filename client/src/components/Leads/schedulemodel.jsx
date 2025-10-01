// ScheduleModal.tsx
import React from 'react'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  lead: any
}

const ScheduleModallead: React.FC<ScheduleModalProps> = ({ isOpen, onClose, lead }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">Schedule Meeting for {lead.company_name}</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Date & Time</label>
            <input type="datetime-local" className="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea className="mt-1 block w-full border rounded p-2" />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Schedule
          </button>
        </form>
      </div>
    </div>
  )
}

export default ScheduleModallead
