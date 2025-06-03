import React from "react";

interface BlockProps {
  children: React.ReactNode;
  className?: string;
}

export default function Block({ children, className = "" }: BlockProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-4 ${className}`}>
      {children}
    </div>
  );
}