import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import './css/journal.css';
import { Button, Form, Row, Col, Spinner, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckSquare, faSquare, faEdit } from '@fortawesome/free-solid-svg-icons';
import { Modal } from 'react-bootstrap';
import AiChat from './AiChat';
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from 'react-datepicker';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { JOURNAL_BFF_BASE_URL } from '../configs/config';


function LogJournal() {
  const [message, setMessage] = useState('');
  const [journal, setJournal] = useState(null);
  const { journalId } = useParams();
  const [dateFilter, setDateFilter] = useState('');
  const [messageFilter, setMessageFilter] = useState('');
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [allSelected, setAllSelected] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [editPayload, setEditPayload] = useState('');
  const [originalLogMessage, setOriginalLogMessage] = useState('');
  const [deleteProcessing, setDeleteProcessing] = useState(false);
  const [reminderDate, setReminderDate] = useState(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);
  const location = useLocation();
  let llmURL = `http://${JOURNAL_BFF_BASE_URL}/journal/analytics`;

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const logId = queryParams.get('logId');
    if (logId) {
      setMessageFilter(logId); // Set the logId in the messageFilter state
    }
  }, [location.search]);

  const handleReminderToggle = async (log) => {
    const payload = {
      ...log,
      reminderNeeded: !log.reminderNeeded, // Toggle the reminderNeeded field
    };

    try {
      const response = await axios.put(`http://${JOURNAL_BFF_BASE_URL}/journal/log/${journalId}`, payload);
      setJournal(response.data);
      toast.success('Reminder toggle operation was successful.');
    } catch (error) {
      console.error('Error updating journal', error);
      toast.error('Reminder toggle operation failed.');
    }
  };

  const handleReminderSave = async () => {
    console.log("currentLog", currentLog);
    console.log("reminderDate", reminderDate);
    console.log("dates", reminderDate.toString());
    console.log("ISO dates", reminderDate.toISOString());

    if (!reminderDate || !currentLog) {
      return;
    }

    const payload = {
      id: currentLog.id,
      createdOn: currentLog.createdOn,
      updatedOn: currentLog.updatedOn,
      message: currentLog.message,
      reminderNeeded: true,
      reminderDate: reminderDate
    };

    try {
      const response = await axios.put(`http://${JOURNAL_BFF_BASE_URL}/journal/log/${journalId}`, payload);
      setJournal(response.data);
      setReminderModalOpen(false);
      toast.success('Reminder save operation was successful.'); // Show success toast
    } catch (error) {
      console.error('Error updating journal', error);
      toast.error('Reminder save operation failed.'); // Show error toast
    } finally {
      setCurrentLog(null);
    }
  };
  const handleDelete = async (journal, selectedMessages) => {
    try {
      setDeleteProcessing(true); // Assume there's a state to track if the operation is in progress
      // Perform the delete operation asynchronously
      await deleteMessages(journal, selectedMessages); // Assuming this is an async function
      // Update UI or state as necessary after deletion
    } catch (error) {
      console.error('Failed to delete messages:', error);
      // Handle error (e.g., show an error message to the user)
    } finally {
      setDeleteProcessing(false); // Reset the processing state
    }
  };

  const deleteMessages = async (journal, messageIds) => {
    // Assuming `messagesCount` is the count of messages to be deleted
    const messagesCount = messageIds.length;

    const isConfirmed = window.confirm(`Are you sure you want to delete ${messagesCount} message(s) from ${journal.name}?`);
    const journalId = journal.id;
    if (isConfirmed) {
      try {
        await axios.delete(`http://${JOURNAL_BFF_BASE_URL}/journal/logs/${journalId}/logs`, { data: messageIds });
        setSelectedMessages([]); // Clear the selected messages

        toast.success(`Deleted ${messagesCount} message(s) from ${journal.name}`);

        // Fetch the updated journal data
        const response = await axios.get(`http://${JOURNAL_BFF_BASE_URL}/journal/logs/${journalId}`);
        setJournal(response.data); // Update the journal state
        setAllSelected(false); // Unselect all messages (if any were selected before)
      } catch (error) {
        toast.error('Error deleting selected messages', error);
      }
    }
  };


  const handleUpdate = async (log) => {

    const payload = {
      id: editPayload.id,
      createdOn: editPayload.createdOn,
      updatedOn: new Date().toISOString(),
      message: editMessage
    };

    try {
      const response = await axios.put(`http://${JOURNAL_BFF_BASE_URL}/journal/log/${journalId}`, payload);
      setJournal(response.data);
      setModalOpen(false); // Close the modal
    } catch (error) {
      console.error('Error updating message', error);
    }
  };


  const handleDateFilterChange = (event) => {
    setDateFilter(event.target.value);
  };

  const handleMessageFilterChange = (event) => {
    setMessageFilter(event.target.value);
  };


  useEffect(() => {
    const fetchJournal = async () => {
      try {
        const response = await axios.get(`http://${JOURNAL_BFF_BASE_URL}/journal/logs/${journalId}`);
        setJournal(response.data);
      } catch (error) {
        console.error('Error fetching journal', error);
      }
    };

    fetchJournal();
  }, [journalId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Check if the message is empty or less than 4 characters
    if (!message || message.length < 4) {
      return;
    }

    const payload = {
      message
    };

    try {
      const response = await axios.patch(`http://${JOURNAL_BFF_BASE_URL}/journal/log/${journalId}`, payload);
      setJournal(response.data);
      setMessage('');
    } catch (error) {
      console.error('Error updating journal', error);
    }
  };

  if (!journal) {
    return <div>Loading...</div>;
  }

  return (

    <div className="main-container">
      <Row>
        <Col className="p-4 shadow">
          <Card className="p-4 shadow">
            <h3>{journal.name}</h3>
            <Form onSubmit={handleSubmit}>
              <Form.Group>
                <Form.Label>New Entry:</Form.Label>
                <Form.Control
                  as="textarea"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Enter a message (at least 4 characters long)"
                />
              </Form.Group>
              <br />
              <Button type="submit" disabled={!message || message.length < 4}>Submit</Button>
            </Form>
            <br />
            <Form>
              <Form.Group>
                <Form.Label>Date Filter:</Form.Label>
                <Form.Control type="date" value={dateFilter} onChange={handleDateFilterChange} />
              </Form.Group>
              <Form.Group>
                <Form.Label>Message Filter:</Form.Label>
                <Form.Control type="text" value={messageFilter} onChange={handleMessageFilterChange} />
              </Form.Group>
            </Form>
              <div>
                <FontAwesomeIcon
                  icon={allSelected ? faSquare : faCheckSquare}
                  onClick={() => {
                    if (allSelected) {
                      // If all messages are currently selected, unselect all messages

                      setSelectedMessages(journal.journalLogs.map(log => log.id));


                    } else {
                      // If not all messages are currently selected, select all messages
                      setSelectedMessages([]);
                    }

                    // Toggle the allSelected state
                    setAllSelected(!allSelected);
                  }}
                />
              <br />
              <div className="message-container">
                {deleteProcessing ? <Spinner animation="border" /> : ""}

                {journal.journalLogs
                  .filter(log => {
                    // If a date filter is set, only include logs from that date
                    if (dateFilter && format(new Date(log.updatedOn), 'yyyy-MM-dd') !== dateFilter) {
                      return false;
                    }

                    // If a message filter is set, only include logs that contain the filter text
                    if (messageFilter && !log.message.toLowerCase().includes(messageFilter.toLowerCase())
                      && !log.id.toLowerCase().includes(messageFilter.toLowerCase())
                    ) {
                      return false;
                    }


                    // If no filters are set, or the log passes all filters, include it
                    return true;
                  })

                  .sort((a, b) => new Date(b.updatedOn) - new Date(a.updatedOn))
                  .map((log, index) => (
                    <div className="log-entry" key={index}>
                      <input
                        type="checkbox"
                        value={log.id}
                        checked={selectedMessages.includes(log.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMessages(prev => [...prev, e.target.value]);
                          } else {
                            setSelectedMessages(prev => prev.filter(id => id !== e.target.value));
                          }
                        }}
                      />

                      <p className={index % 2 === 0 ? 'bg-msg-one log-message' : 'bg-msg-two log-message'} key={index}><strong>{format(new Date(log.updatedOn), 'yyyy-MMMM-dd HH:mm:ss')}</strong>: <i>{log.message}</i>
                      </p>
                      <FontAwesomeIcon
                        icon={faEdit}
                        onClick={() => {
                          setEditMessage(log.message);
                          setOriginalLogMessage(log.message);
                          setEditPayload(log);
                          setModalOpen(true);
                        }}
                      />
                      <Button onClick={() => {
                        console.log("log", log);
                        setCurrentLog(log);
                        setReminderDate(log.reminderDate ? new Date(log.reminderDate) : null);
                        setReminderModalOpen(true);
                      }}>
                        <FontAwesomeIcon icon={faClock} />
                      </Button>

                      {new Date(log.reminderDate) > new Date() ? (
                        <FontAwesomeIcon
                          icon={faBell}
                          style={{ color: log.reminderNeeded ? 'black' : 'grey' }}
                          onClick={() => handleReminderToggle(log)}
                        />
                      ) : null}



                    </div>

                  ))}
              </div>
            </div>
            <div className="delete-button-container">
              <Button
                disabled={selectedMessages.length === 0} // Button is disabled if no messages are selected
                onClick={() => handleDelete(journal, selectedMessages)}
              >
                DELETE
              </Button>
            </div>
          </Card>
        </Col>
        <Col className="p-4 shadow" >
          <AiChat llmURL={llmURL + '/' + journalId} />
        </Col>
      </Row>
      <Modal show={reminderModalOpen} onHide={() => setReminderModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Set Reminder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DatePicker
            selected={reminderDate}
            onChange={date => setReminderDate(date)}
            showTimeSelect
            minDate={new Date()}
            minTime={new Date()}
            maxTime={new Date().setHours(23, 59)}
            dateFormat="Pp"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setReminderModalOpen(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleReminderSave} disabled={!reminderDate}>
            Save Reminder
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={modalOpen} onHide={() => setModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Message:</Form.Label>
            <Form.Control
              as="textarea"
              value={editMessage}
              onChange={e => setEditMessage(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleUpdate} disabled={editMessage === originalLogMessage}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default LogJournal;