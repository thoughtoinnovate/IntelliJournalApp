import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';

function Journal() {
  const navigate = useNavigate();

  const handleCreateNew = () => {
    navigate('/create-journal');
  };

  const handleLoadExisting = () => {
    navigate('/all-journals');
  };

  return (
    <div className="page-content">
       <Button variant="primary" onClick={handleCreateNew}>Create New</Button>
       <Button variant="primary" onClick={handleLoadExisting}>Load Existing</Button>
    </div>
  );
}

export default Journal;