// src/Reminders.js
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FaEye } from 'react-icons/fa';
import { Container, Card, Table, Tabs, Tab, Button } from 'react-bootstrap';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { JOURNAL_BFF_BASE_URL } from '../configs/config';


function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [pastReminders, setPastReminders] = useState([]);
  let websocketURL=`ws://${JOURNAL_BFF_BASE_URL}/reminders`;
  
  const [key, setKey] = useState('today');
  const navigate = useNavigate();

  const handleViewClick = (reminder,log) => {
    navigate('/log-journal/' + reminder.id+'?logId='+log.id);
  };


const fetchFutureReminders = async () => {
      try {
        const response = await axios.get(`http://${JOURNAL_BFF_BASE_URL}/journal/logs/reminders?futureOnly=true`);
        setReminders(response.data);
      } catch (error) {
        console.error('Error fetching reminders', error);
      }
    };

    const fetchPastReminders = async () => {
      try {
        const response = await axios.get(`http://${JOURNAL_BFF_BASE_URL}/journal/logs/reminders?futureOnly=false`);
        setPastReminders(response.data);
      } catch (error) {
        console.error('Error fetching reminders', error);
      }
    };
 useEffect(() => {
    fetchFutureReminders();
    fetchPastReminders();

  }, []);


  const today = format(new Date(), 'yyyy-MM-dd');
const todaysReminders = reminders.map(reminder => ({
  ...reminder,
  journalLogs: reminder.journalLogs.filter(log => format(new Date(log.reminderDate), 'yyyy-MM-dd') === today)
})).filter(reminder => reminder.journalLogs.length > 0);

const futureReminders = reminders.map(reminder => ({
  ...reminder,
  journalLogs: reminder.journalLogs.filter(log => format(new Date(log.reminderDate), 'yyyy-MM-dd') > today)
})).filter(reminder => reminder.journalLogs.length > 0);

const handleDelete = async (journalId, logId) => {
console.log('journalId', journalId);
console.log('logId', logId);
  try {
    await axios.delete(`http://${JOURNAL_BFF_BASE_URL}/journal/${journalId}/logs/reminder/${logId}`);
    toast.success('Reminder deleted successfully');
    // Refetch the data
        fetchFutureReminders();
        fetchPastReminders();
  } catch (error) {
    toast.error('Error deleting reminder');
  }
};


  const renderTable = (reminders) => (
   <Table striped bordered hover>
       <thead>
         <tr>
           <th>Journal Name</th>
           <th>Log Message</th>
           <th>Reminder Date</th>
           <th>Reminder Time</th>
           <th>Actions</th>
         </tr>
       </thead>
       <tbody>
         {reminders.flatMap((reminder, index) =>
           reminder.journalLogs.map((log, logIndex) => (
             <tr key={`${index}-${logIndex}`}>
               <td>{reminder.name}</td>
               <td>{log.message}</td>
               <td>{format(new Date(log.reminderDate), 'yyyy-MM-dd')}</td>
               <td>{format(new Date(log.reminderDate), 'HH:mm')}</td>
               <td>
                 <Button variant="danger" onClick={() => handleDelete(reminder.id, log.id)}>-</Button>
                <Button onClick={() => handleViewClick(reminder,log)} variant="link">
                  <FaEye />
                </Button>
               </td>
             </tr>
           ))
         )}
       </tbody>
     </Table>
  );

  return (
    <Container>
      <h1>Reminders Page</h1>
      <Tabs id="reminders-tabs" activeKey={key} onSelect={(k) => setKey(k)}>
        <Tab eventKey="today" title="Today's Reminders">
          <Card>
            <Card.Body>
              {renderTable(todaysReminders)}
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="future" title="Future Reminders">
          <Card>
            <Card.Body>
              {renderTable(futureReminders)}
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="past" title="Past Reminders">
          <Card>
            <Card.Body>
              {renderTable(pastReminders)}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
}

export default Reminders;