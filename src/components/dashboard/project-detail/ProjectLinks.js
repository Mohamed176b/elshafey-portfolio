import React from "react";
import { Link } from "react-router-dom";

const ProjectLinks = React.memo(({ demoLink, githubLink }) => {
  return (
    <div className="links pro-det-sec">
      <Link to={demoLink} target="_blank">
        <i className="fa-solid fa-display"></i>
        <span>Live Demo</span>
      </Link>
      {githubLink && (
        <Link to={githubLink} target="_blank">
          <i className="fa-brands fa-square-github"></i>
          <span>GitHub</span>
        </Link>
      )}
    </div>
  );
});

export default ProjectLinks;
