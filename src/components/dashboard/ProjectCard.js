import React, { memo } from "react";
import { useNavigate } from "react-router-dom";

const ProjectCard = memo(
  ({
    project,
    index,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDrop,
    onView,
    userData,
  }) => {
    const navigate = useNavigate();

    return (
      <div
        className="project"
        draggable="true"
        onDragStart={(e) => onDragStart(e, index)}
        onDragOver={(e) => onDragOver(e, index)}
        onDragEnd={onDragEnd}
        onDrop={onDrop}
      >
        <div className="drag-handle">
          <i className="fa-solid fa-grip-vertical"></i>
        </div>
        <div className="pro-img">
          <img alt={project.name} src={project.thumbnailUrl} loading="lazy" />
        </div>
        <div className="pro-con">
          <div>
            <h5>{project.name}</h5>
            <p>{project.description}</p>
            <span className="order-badge">Order: {index + 1}</span>
          </div>
          <div className="pro-btns">
            <button
              onClick={() =>
                navigate(`/dashboard/projects/edit-project/${project.id}`, {
                  state: { user: userData.user },
                })
              }
            >
              Edit
            </button>
            <button onClick={() => onView(project.id)}>View</button>
          </div>
        </div>
      </div>
    );
  }
);

ProjectCard.displayName = "ProjectCard";

export default ProjectCard;
