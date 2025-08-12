import React from "react";

type Props = {
  children: React.ReactNode;
};

const PageTitle = ({ children }: Props) => {
  return <h1 className="text-3xl font-bold text-accent">{children}</h1>;
};

export default PageTitle;
