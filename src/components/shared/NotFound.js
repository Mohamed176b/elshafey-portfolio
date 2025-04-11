import React, { memo } from "react";
import { Link } from "react-router-dom";
import "../../styles/NotFound.css";

const NotFound = memo(() => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Sorry, the page does not exist</h2>
        <p>
          The page you are looking for may be deleted or unavailable at this
          time.
        </p>
        <Link to="/" className="home-button">
          <i className="fa-solid fa-home"></i>
          Back to Portfolio Page
        </Link>
      </div>
    </div>
  );
});

NotFound.displayName = "NotFound";

export default NotFound;
