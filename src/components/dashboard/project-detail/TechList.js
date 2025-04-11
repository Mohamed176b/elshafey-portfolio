import React from "react";

const TechList = React.memo(({ techs }) => {
  if (!techs.length) {
    return <p>No technologies specified.</p>;
  }

  return (
    <div className="tech-list pro-det-sec">
      {techs.map((tech) => (
        <div key={tech.id} className="tech-item">
          <img src={tech.logo_url} alt={tech.name} width="50" loading="lazy" />
          <h4>{tech.name}</h4>
        </div>
      ))}
    </div>
  );
});

export default TechList;
