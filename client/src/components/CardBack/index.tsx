

import React from "react";

interface CardBackProps {
  definition: string;
}

export const CardBack: React.FC<CardBackProps> = ({ definition }) => {
  return (
    <div className="card-back p-4">
      <p>{definition}</p>
    </div>
  );
};
