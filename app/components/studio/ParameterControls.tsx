import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { currentParameters, updateParameter, addParameter, removeParameter } from '~/lib/stores/studio';
import type { Parameter } from '~/types/studio';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';

export function ParameterControls() {
  const parameters = useStore(currentParameters);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState<Partial<Parameter>>({
    type: 'string',
    required: false,
    visible: true,
    order: 0,
  });

  const handleAddParameter = () => {
    if (!formData.name || !formData.id) {
      return;
    }

    const param: Parameter = {
      id: formData.id || `param_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      type: formData.type || 'string',
      defaultValue: formData.defaultValue || '',
      required: formData.required || false,
      visible: formData.visible !== false,
      order: formData.order || parameters.length,
    };

    if (editingId) {
      updateParameter(editingId, param);
      setEditingId(null);
    } else {
      addParameter(param);
    }

    setFormData({ type: 'string', required: false, visible: true, order: 0 });
    setShowAdd(false);
  };

  const handleEdit = (param: Parameter) => {
    setFormData(param);
    setEditingId(param.id);
    setShowAdd(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Parameters</h3>
        <button
          onClick={() => {
            setShowAdd(!showAdd);
            setEditingId(null);
            setFormData({ type: 'string', required: false, visible: true, order: 0 });
          }}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <MdAdd className="size-4" />
          Add Parameter
        </button>
      </div>

      {showAdd && (
        <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 dark:border-gray-600 dark:bg-gray-900 space-y-3">
          <input
            type="text"
            placeholder="Parameter ID"
            value={formData.id || ''}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <input
            type="text"
            placeholder="Parameter Name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <textarea
            placeholder="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            rows={2}
          />
          <select
            value={formData.type || 'string'}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="select">Select</option>
            <option value="multiselect">Multi-Select</option>
            <option value="slider">Slider</option>
            <option value="textarea">Textarea</option>
          </select>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.required || false}
                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
              />
              <span>Required</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.visible !== false}
                onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
              />
              <span>Visible</span>
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowAdd(false);
                setEditingId(null);
              }}
              className="px-3 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddParameter}
              className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              {editingId ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {parameters.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No parameters yet</p>
        ) : (
          parameters.map((param) => (
            <div
              key={param.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{param.name}</div>
                {param.description && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">{param.description}</div>
                )}
                <div className="flex gap-2 mt-1 text-xs text-gray-500">
                  <span className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{param.type}</span>
                  {param.required && (
                    <span className="bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                      Required
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(param)}
                  className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                >
                  <MdEdit className="size-4" />
                </button>
                <button
                  onClick={() => removeParameter(param.id)}
                  className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                >
                  <MdDelete className="size-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
