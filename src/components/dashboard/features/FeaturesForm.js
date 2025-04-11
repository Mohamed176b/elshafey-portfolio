import React, { memo } from "react";

const FeaturesForm = memo(
  ({
    features,
    newFeature,
    editingIndex,
    editingValue,
    onFeatureAdd,
    onFeatureDelete,
    onFeatureEdit,
    onFeatureSave,
    onNewFeatureChange,
    onEditValueChange,
    onKeyDown,
    onCancelEdit,
  }) => {
    return (
      <div className="features">
        <h2>Features</h2>
        <div className="input-field">
          <input
            className="add-pro-input"
            placeholder="Add New Feature"
            type="text"
            value={editingIndex !== null ? editingValue : newFeature}
            onChange={(e) =>
              editingIndex !== null
                ? onEditValueChange(e.target.value)
                : onNewFeatureChange(e.target.value)
            }
            onKeyDown={onKeyDown}
          />
          <button
            onClick={editingIndex !== null ? onFeatureSave : onFeatureAdd}
          >
            {editingIndex !== null ? "Save" : "Add"}
          </button>
          {editingIndex !== null && (
            <button onClick={onCancelEdit}>Cancel</button>
          )}
        </div>
        <div className="features-list">
          {features.map((feature, index) => (
            <div key={index} className="feature-item">
              <span>{feature}</span>
              <div>
                <button
                  className="edit-fea"
                  title="Edit"
                  onClick={() => onFeatureEdit(index)}
                >
                  <i className="fa-solid fa-pen"></i>
                </button>
                <button
                  className="delete-fea"
                  title="Delete"
                  onClick={() => onFeatureDelete(index)}
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

FeaturesForm.displayName = "FeaturesForm";
export default FeaturesForm;
