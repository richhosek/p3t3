import React from "react";

interface CardFrontProps {
  term: string;
}

export const CardFront: React.FC<CardFrontProps> = ({ term }) => {
  return (
    <div className="card-front p-4">
      <p>{term}</p>
    </div>
  );
};
