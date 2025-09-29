// components/UserAccount.js
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const UserAccount = ({ userName = "Sanjith" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get first letter of username
  const userInitial = userName ? userName.charAt(0).toUpperCase() : 'U';

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="user-account" ref={dropdownRef}>
      <button 
        className="user-account-toggle"
        onClick={toggleDropdown}
      >
        <div className="user-avatar">
          {userInitial}
        </div>
        <span className="user-name">{userName}</span>
        <i className="bi bi-three-dots"></i>
      </button>

      {isOpen && (
        <div className="user-dropdown">
          <div className="user-dropdown-header">
            <div className="user-dropdown-avatar">
              {userInitial}
            </div>
            <div className="user-dropdown-info">
              <div className="user-dropdown-name">{userName}</div>
              <div className="user-dropdown-email">sanjith@example.com</div>
            </div>
          </div>
          
          <div className="user-dropdown-divider"></div>
          
          <Link to="/app/settings" className="user-dropdown-item">
            <i className="bi bi-gear"></i>
            Settings
          </Link>
          
          <Link to="/app/account" className="user-dropdown-item">
            <i className="bi bi-person"></i>
            Account
          </Link>
          
          <div className="user-dropdown-divider"></div>
          
          <button className="user-dropdown-item logout">
            <i className="bi bi-box-arrow-right"></i>
            Log out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserAccount;