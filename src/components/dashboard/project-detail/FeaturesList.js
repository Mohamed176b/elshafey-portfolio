import React from "react";

const FeaturesList = React.memo(({ features }) => {
  if (!features?.length) {
    return <p>No features specified.</p>;
  }

  return (
    <>
      {features.map((text, index) => (
        <div className="pro-det-fea" key={index}>
          {text}
        </div>
      ))}
    </>
  );
});

export default FeaturesList;
