import { BrowserRouter as Router, Routes, Route,Link } from 'react-router-dom';
import AiChat from './journal/AiChat'
import Journal from './journal/journal';
import CreateJournal from './journal/CreateJournal';
import AllJournals from './journal/AllJournals';
import LogJournal from './journal/LogJournal';
import { Navbar, Nav } from 'react-bootstrap';
import { Dropdown } from 'react-bootstrap';
import Reminders from './journal/Reminders';
import React, { useState } from 'react';
import { FaBell } from 'react-icons/fa';
import './journal/css/NotificationBell.css';
import useWebSocket from './journalWebSocket';
import './css/global-page.css';
import { ToastContainer, toast } from 'react-toastify';
import { JOURNAL_BFF_BASE_URL } from './configs/config';

function App() {
  //global state
  const [notifications, setNotifications] = useState([]);
  let websocketURL = `ws://${JOURNAL_BFF_BASE_URL}/reminders`;

  const removeNotification = (index) => {
    setNotifications(prevNotifications => {
      const updatedNotifications = prevNotifications.filter((notification, i) => i !== index);
      console.log('Updated Notifications:', updatedNotifications);
      return updatedNotifications;
    });
  }

  const handleWebSocketMessage = (dataFromServer) => {
    
    console.log('dataFromServer', dataFromServer);

    setNotifications(prevNotifications => {
      const updatedNotifications = [...prevNotifications, dataFromServer.message];
      console.log('Updated Notifications:', updatedNotifications);
      return updatedNotifications;
    });

    toast.success(dataFromServer.message);

    if (Notification.permission === 'granted') {
      new Notification('Reminder Update', {
        body: 'Journal Reminder: ' + dataFromServer.message,
        tag: 'reminder-update', // Add a non-empty tag
      });

    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Reminder Update', {
            body: 'Journal Reminder: ' + dataFromServer.message,
          });
        }
      });
    }
  };

  useWebSocket(websocketURL, handleWebSocketMessage)


  const NotificationBell = ({ notifications }) => {
    const [showNotifications, setShowNotifications] = useState(false);

    const toggleNotifications = () => {
      setShowNotifications(!showNotifications);
    };

    return (
      <div className="notification-bell">
        <FaBell onClick={toggleNotifications} />
        {notifications.length > 0 && <span className="notification-count">{notifications.length}</span>}
        {showNotifications && (
          <div className="notification-dropdown">
            {notifications.map((notification, index) => (
              <div key={index} className="notification-banner">
                {notification}
                <button className="close-button" onClick={() => removeNotification(index)}>✖️</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Router basename="/app">
      <div className="centered-container">
        <Navbar bg="light" expand="lg">
          <Navbar.Brand as={Link} to="/ai-chat">Home</Navbar.Brand>
          <Navbar.Brand as={Link} to="/reminders">Reminders</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <Dropdown>
                <Dropdown.Toggle id="dropdown-basic" className='menu-item'>
                  Journal
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/all-journals">Load Existing</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
          <div className='bell-div'>
            <NotificationBell notifications={notifications} />
          </div>
        </Navbar>

        <Routes>
          <Route path="/journal" element={<Journal />} />
          <Route path="/ai-chat" element={<AiChat />} />
          <Route path="/create-journal" element={<CreateJournal />} />
          <Route path="/all-journals" element={<AllJournals />} />
          <Route path="/log-journal/:journalId" element={<LogJournal />} />
          <Route path="/reminders" element={<Reminders />} />
          {/* Add more Route components for additional routes */}
        </Routes>
      <ToastContainer/>
      </div>
    </Router>

  );
}

export default App;