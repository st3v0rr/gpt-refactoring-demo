import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const PropertyPanel = ({ node, onUpdate, onDelete, onClose }) => {
  const [localData, setLocalData] = useState(node.data);

  useEffect(() => {
    setLocalData(node.data);
  }, [node]);

  const handleSave = () => {
    onUpdate(node.id, localData);
  };

  const handleFieldChange = (field, value) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddField = () => {
    const newField = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'newField',
      type: 'string',
      required: false
    };
    setLocalData(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }));
  };

  const handleUpdateField = (fieldId, updates) => {
    setLocalData(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    }));
  };

  const handleDeleteField = (fieldId) => {
    setLocalData(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }));
  };

  const handleAddRequestField = (parentId = null) => {
    const newField = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'fieldName',
      type: 'string',
      required: false,
      validation: '',
      parentId: parentId,
      children: []
    };
    setLocalData(prev => ({
      ...prev,
      requestFields: [...(prev.requestFields || []), newField]
    }));
  };

  const handleUpdateRequestField = (fieldId, updates) => {
    setLocalData(prev => ({
      ...prev,
      requestFields: prev.requestFields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    }));
  };

  const handleDeleteRequestField = (fieldId) => {
    setLocalData(prev => ({
      ...prev,
      requestFields: prev.requestFields.filter(f => f.id !== fieldId && f.parentId !== fieldId)
    }));
  };

  const handleAddResponseField = (parentId = null) => {
    const newField = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'fieldName',
      type: 'string',
      required: false,
      description: '',
      parentId: parentId,
      children: []
    };
    setLocalData(prev => ({
      ...prev,
      responseFields: [...(prev.responseFields || []), newField]
    }));
  };

  const handleUpdateResponseField = (fieldId, updates) => {
    setLocalData(prev => ({
      ...prev,
      responseFields: prev.responseFields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    }));
  };

  const handleDeleteResponseField = (fieldId) => {
    setLocalData(prev => ({
      ...prev,
      responseFields: prev.responseFields.filter(f => f.id !== fieldId && f.parentId !== fieldId)
    }));
  };

  const renderEntityProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Entity Name</label>
        <input
          type="text"
          value={localData.name || ''}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Fields</label>
          <button
            onClick={handleAddField}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-3 h-3" />
            Add Field
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {(localData.fields || []).map(field => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) => handleUpdateField(field.id, { name: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Field name"
                />
                <button
                  onClick={() => handleDeleteField(field.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <select
                  value={field.type}
                  onChange={(e) => handleUpdateField(field.id, { type: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                  <option value="enum">Enum</option>
                  <option value="reference">Reference</option>
                </select>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={field.required || false}
                    onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                    className="rounded"
                  />
                  Required
                </label>
              </div>
              {field.type === 'reference' && (
                <input
                  type="text"
                  value={field.referenceEntity || ''}
                  onChange={(e) => handleUpdateField(field.id, { referenceEntity: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Reference entity name"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderApiEndpointProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">HTTP Method</label>
        <select
          value={localData.method || 'GET'}
          onChange={(e) => handleFieldChange('method', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Path</label>
        <input
          type="text"
          value={localData.path || ''}
          onChange={(e) => handleFieldChange('path', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="/api/endpoint"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
        <textarea
          value={localData.summary || ''}
          onChange={(e) => handleFieldChange('summary', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="Endpoint description"
        />
      </div>

      {/* Request Fields */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Request Fields</label>
          <button
            onClick={() => handleAddRequestField()}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Plus className="w-3 h-3" />
            Add Field
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {(localData.requestFields || []).filter(f => !f.parentId).map(field => (
            <div key={field.id}>
              <div className="border border-green-200 rounded-lg p-2 space-y-2 bg-green-50">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => handleUpdateRequestField(field.id, { name: e.target.value })}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Field name"
                  />
                  {(field.type === 'object' || field.type === 'array') && (
                    <button
                      onClick={() => handleAddRequestField(field.id)}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                      title="Add nested field"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteRequestField(field.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={field.type}
                    onChange={(e) => handleUpdateRequestField(field.id, { type: e.target.value })}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                    <option value="email">Email</option>
                    <option value="url">URL</option>
                    <option value="array">Array</option>
                    <option value="object">Object</option>
                  </select>
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={field.required || false}
                      onChange={(e) => handleUpdateRequestField(field.id, { required: e.target.checked })}
                      className="rounded"
                    />
                    Required
                  </label>
                </div>
                <input
                  type="text"
                  value={field.validation || ''}
                  onChange={(e) => handleUpdateRequestField(field.id, { validation: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Validation (e.g., min:3, max:100, pattern:...)"
                />
              </div>

              {/* Nested Fields */}
              {(localData.requestFields || []).filter(f => f.parentId === field.id).map(childField => (
                <div key={childField.id} className="ml-4 mt-2 border border-green-300 rounded-lg p-2 space-y-2 bg-green-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">└</span>
                    <input
                      type="text"
                      value={childField.name}
                      onChange={(e) => handleUpdateRequestField(childField.id, { name: e.target.value })}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="Nested field name"
                    />
                    <button
                      onClick={() => handleDeleteRequestField(childField.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <select
                      value={childField.type}
                      onChange={(e) => handleUpdateRequestField(childField.id, { type: e.target.value })}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="date">Date</option>
                      <option value="email">Email</option>
                      <option value="url">URL</option>
                      <option value="array">Array</option>
                      <option value="object">Object</option>
                    </select>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={childField.required || false}
                        onChange={(e) => handleUpdateRequestField(childField.id, { required: e.target.checked })}
                        className="rounded"
                      />
                      Required
                    </label>
                  </div>
                  <input
                    type="text"
                    value={childField.validation || ''}
                    onChange={(e) => handleUpdateRequestField(childField.id, { validation: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 ml-4"
                    placeholder="Validation"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Response Fields */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Response Fields</label>
          <button
            onClick={() => handleAddResponseField()}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-3 h-3" />
            Add Field
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {(localData.responseFields || []).filter(f => !f.parentId).map(field => (
            <div key={field.id}>
              <div className="border border-blue-200 rounded-lg p-2 space-y-2 bg-blue-50">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => handleUpdateResponseField(field.id, { name: e.target.value })}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Field name"
                  />
                  {(field.type === 'object' || field.type === 'array') && (
                    <button
                      onClick={() => handleAddResponseField(field.id)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Add nested field"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteResponseField(field.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={field.type}
                    onChange={(e) => handleUpdateResponseField(field.id, { type: e.target.value })}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                    <option value="array">Array</option>
                    <option value="object">Object</option>
                    <option value="null">Null</option>
                  </select>
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={field.required || false}
                      onChange={(e) => handleUpdateResponseField(field.id, { required: e.target.checked })}
                      className="rounded"
                    />
                    Required
                  </label>
                </div>
                <input
                  type="text"
                  value={field.description || ''}
                  onChange={(e) => handleUpdateResponseField(field.id, { description: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Field description"
                />
              </div>

              {/* Nested Fields */}
              {(localData.responseFields || []).filter(f => f.parentId === field.id).map(childField => (
                <div key={childField.id} className="ml-4 mt-2 border border-blue-300 rounded-lg p-2 space-y-2 bg-blue-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">└</span>
                    <input
                      type="text"
                      value={childField.name}
                      onChange={(e) => handleUpdateResponseField(childField.id, { name: e.target.value })}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Nested field name"
                    />
                    <button
                      onClick={() => handleDeleteResponseField(childField.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <select
                      value={childField.type}
                      onChange={(e) => handleUpdateResponseField(childField.id, { type: e.target.value })}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="date">Date</option>
                      <option value="array">Array</option>
                      <option value="object">Object</option>
                      <option value="null">Null</option>
                    </select>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={childField.required || false}
                        onChange={(e) => handleUpdateResponseField(childField.id, { required: e.target.checked })}
                        className="rounded"
                      />
                      Required
                    </label>
                  </div>
                  <input
                    type="text"
                    value={childField.description || ''}
                    onChange={(e) => handleUpdateResponseField(childField.id, { description: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ml-4"
                    placeholder="Description"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUIComponentProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Component Name</label>
        <input
          type="text"
          value={localData.name || ''}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Component Type</label>
        <select
          value={localData.componentType || 'component'}
          onChange={(e) => handleFieldChange('componentType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="page">Page</option>
          <option value="component">Component</option>
          <option value="form">Form</option>
          <option value="modal">Modal</option>
        </select>
      </div>
    </div>
  );

  const renderActivityProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
        <input
          type="text"
          value={localData.label || ''}
          onChange={(e) => handleFieldChange('label', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={localData.description || ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>
    </div>
  );

  const renderContainerProperties = () => {
    const handleAddPort = () => {
      const ports = localData.ports || [];
      setLocalData(prev => ({
        ...prev,
        ports: [...ports, '8080:8080']
      }));
    };

    const handleUpdatePort = (index, value) => {
      const ports = [...(localData.ports || [])];
      ports[index] = value;
      setLocalData(prev => ({ ...prev, ports }));
    };

    const handleDeletePort = (index) => {
      const ports = (localData.ports || []).filter((_, i) => i !== index);
      setLocalData(prev => ({ ...prev, ports }));
    };

    const handleAddEnvVar = () => {
      const environment = localData.environment || [];
      setLocalData(prev => ({
        ...prev,
        environment: [...environment, { key: 'KEY', value: 'value' }]
      }));
    };

    const handleUpdateEnvVar = (index, field, value) => {
      const environment = [...(localData.environment || [])];
      environment[index] = { ...environment[index], [field]: value };
      setLocalData(prev => ({ ...prev, environment }));
    };

    const handleDeleteEnvVar = (index) => {
      const environment = (localData.environment || []).filter((_, i) => i !== index);
      setLocalData(prev => ({ ...prev, environment }));
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Container Name</label>
          <input
            type="text"
            value={localData.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
          <input
            type="text"
            value={localData.image || ''}
            onChange={(e) => handleFieldChange('image', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
            placeholder="nginx:latest"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Ports</label>
            <button
              onClick={handleAddPort}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-cyan-600 text-white rounded hover:bg-cyan-700"
            >
              <Plus className="w-3 h-3" />
              Add Port
            </button>
          </div>
          <div className="space-y-2">
            {(localData.ports || []).map((port, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={port}
                  onChange={(e) => handleUpdatePort(index, e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  placeholder="8080:8080"
                />
                <button
                  onClick={() => handleDeletePort(index)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Environment Variables</label>
            <button
              onClick={handleAddEnvVar}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-cyan-600 text-white rounded hover:bg-cyan-700"
            >
              <Plus className="w-3 h-3" />
              Add Var
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(localData.environment || []).map((env, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={env.key || ''}
                  onChange={(e) => handleUpdateEnvVar(index, 'key', e.target.value)}
                  className="w-1/3 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  placeholder="KEY"
                />
                <input
                  type="text"
                  value={env.value || ''}
                  onChange={(e) => handleUpdateEnvVar(index, 'value', e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  placeholder="value"
                />
                <button
                  onClick={() => handleDeleteEnvVar(index)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Replicas</label>
          <input
            type="number"
            value={localData.replicas || 1}
            onChange={(e) => handleFieldChange('replicas', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            min="1"
          />
        </div>
      </div>
    );
  };

  const renderDatabaseDeploymentProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Database Name</label>
        <input
          type="text"
          value={localData.name || ''}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Engine</label>
        <select
          value={localData.engine || 'PostgreSQL'}
          onChange={(e) => handleFieldChange('engine', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="PostgreSQL">PostgreSQL</option>
          <option value="MySQL">MySQL</option>
          <option value="MongoDB">MongoDB</option>
          <option value="Redis">Redis</option>
          <option value="Cassandra">Cassandra</option>
          <option value="Oracle">Oracle</option>
          <option value="SQL Server">SQL Server</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
        <input
          type="text"
          value={localData.version || ''}
          onChange={(e) => handleFieldChange('version', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="15"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Storage</label>
        <input
          type="text"
          value={localData.storage || ''}
          onChange={(e) => handleFieldChange('storage', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="20GB"
        />
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={localData.backup || false}
            onChange={(e) => handleFieldChange('backup', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Enable Backup</span>
        </label>
      </div>
    </div>
  );

  const renderActivityContainerProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Activity Name</label>
        <input
          type="text"
          value={localData.name || ''}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={localData.description || ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          rows={3}
        />
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs text-purple-800">
          This Activity Diagram contains {(localData.activityNodes || []).length} nodes and {(localData.activityEdges || []).length} connections.
        </p>
      </div>
    </div>
  );

  const renderProperties = () => {
    switch (node.type) {
      case 'entity':
        return renderEntityProperties();
      case 'api-endpoint':
        return renderApiEndpointProperties();
      case 'ui-component':
        return renderUIComponentProperties();
      case 'activity-container':
        return renderActivityContainerProperties();
      case 'activity-start':
      case 'activity-end':
      case 'activity-action':
      case 'activity-decision':
        return renderActivityProperties();
      case 'deployment-container':
        return renderContainerProperties();
      case 'deployment-database':
        return renderDatabaseDeploymentProperties();
      default:
        return <div className="text-sm text-gray-500">No properties available</div>;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Properties</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 px-3 py-2 bg-gray-100 rounded-lg">
          <div className="text-xs text-gray-500">Node Type</div>
          <div className="font-medium capitalize">{node.type.replace(/-/g, ' ')}</div>
        </div>

        {renderProperties()}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save
        </button>
        <button
          onClick={() => onDelete(node.id)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PropertyPanel;