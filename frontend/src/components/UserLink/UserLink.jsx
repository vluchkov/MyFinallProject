import React from 'react';
import { Link } from 'react-router-dom';

const UserLink = ({ username, children, className, ...props }) => {
  if (!username) return <span className={className}>{children}</span>;
  return (
    <Link to={`/profile/${username}`} style={{textDecoration: 'none', color: 'black'}} className={className} {...props}>
      {children}
    </Link>
  );
};

export default UserLink; 