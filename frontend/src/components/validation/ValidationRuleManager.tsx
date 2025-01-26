import React, { useState } from 'react';
import { ValidationRule, ValidationIssueType } from '../../services/validationService';
import NotificationService from '../../services/notificationService';

interface ValidationRuleManagerProps {
  rules: ValidationRule[];
  onAddRule: (rule: ValidationRule) => void;
  onUpdateRule: (index: number, rule: ValidationRule) => void;
  onDeleteRule: (index: number) => void;
}

const ValidationRuleManager: React.FC<ValidationRuleManagerProps> = ({
  rules,
  onAddRule,
  onUpdateRule,
  onDeleteRule
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newRule, setNewRule] = useState<Partial<ValidationRule>>({
    pattern: '',
    message: '',
    severity: 'medium',
    type: 'technical_accuracy'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRule.pattern || !newRule.message || !newRule.severity || !newRule.type) {
      NotificationService.error('Please fill in all required fields');
      return;
    }

    try {
      // Test if the pattern is a valid regex
      new RegExp(newRule.pattern);
    } catch (error) {
      NotificationService.error('Invalid regular expression pattern');
      return;
    }

    if (editingIndex !== null) {
      onUpdateRule(editingIndex, newRule as ValidationRule);
      setEditingIndex(null);
    } else {
      onAddRule(newRule as ValidationRule);
    }

    setNewRule({
      pattern: '',
      message: '',
      severity: 'medium',
      type: 'technical_accuracy'
    });
    setIsAdding(false);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setNewRule(rules[index]);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingIndex(null);
    setNewRule({
      pattern: '',
      message: '',
      severity: 'medium',
      type: 'technical_accuracy'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Custom Validation Rules</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Rule
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div>
            <label htmlFor="pattern" className="block text-sm font-medium text-gray-700">
              Pattern (RegExp)
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="pattern"
                value={newRule.pattern}
                onChange={(e) => setNewRule(prev => ({ ...prev, pattern: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., \b(very|really|quite)\b"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter a regular expression pattern. Remember to escape special characters with backslashes.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message
            </label>
            <input
              type="text"
              id="message"
              value={newRule.message}
              onChange={(e) => setNewRule(prev => ({ ...prev, message: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Consider using more specific language"
            />
          </div>

          <div>
            <label htmlFor="suggestion" className="block text-sm font-medium text-gray-700">
              Suggestion (optional)
            </label>
            <input
              type="text"
              id="suggestion"
              value={newRule.suggestion || ''}
              onChange={(e) => setNewRule(prev => ({ ...prev, suggestion: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Replace with more precise terminology"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-gray-700">
                Severity
              </label>
              <select
                id="severity"
                value={newRule.severity}
                onChange={(e) => setNewRule(prev => ({ ...prev, severity: e.target.value as 'high' | 'medium' | 'low' }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                id="type"
                value={newRule.type}
                onChange={(e) => setNewRule(prev => ({ ...prev, type: e.target.value as ValidationIssueType }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="technical_accuracy">Technical Accuracy</option>
                <option value="industry_standards">Industry Standards</option>
                <option value="content_structure">Content Structure</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {editingIndex !== null ? 'Update Rule' : 'Add Rule'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {rules.map((rule, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{rule.message}</h3>
                <p className="mt-1 text-sm text-gray-500">Pattern: <code>{rule.pattern.toString()}</code></p>
                {rule.suggestion && (
                  <p className="mt-1 text-sm text-gray-500">Suggestion: {rule.suggestion}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(index)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteRule(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-2 flex space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                rule.severity === 'high' ? 'bg-red-100 text-red-800' :
                rule.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {rule.severity}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {rule.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ValidationRuleManager; 