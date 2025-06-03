import React from "react";

interface BlockContentProps {
  children: React.ReactNode;
}

export default function BlockContent({ children }: BlockContentProps) {
  return <div className="p-4">{children}</div>;
}
