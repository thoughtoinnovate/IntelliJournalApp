import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Container, Card, Form, Modal, Button } from 'react-bootstrap';
import './css/journal.css';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import { Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEye, faPlus } from '@fortawesome/free-solid-svg-icons';
import { JOURNAL_BFF_BASE_URL } from '../configs/config';

function AllJournals() {
  const [journals, setJournals] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
   const [sortDirection, setSortDirection] = useState('desc');
    const [sortColumn, setSortColumn] = useState('updatedDate');
      const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [entry, setEntry] = useState('');
  const [titleError, setTitleError] = useState('');
  const [entryError, setEntryError] = useState('');

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const response = await axios.get(`http://${JOURNAL_BFF_BASE_URL}/journal/all`);
        setJournals(response.data);
      } catch (error) {
        console.error('Error fetching journals', error);
      }
    };

    fetchJournals();
  }, []);

const handleAddJournal = async (event) => {
  event.preventDefault();

  if (title.length < 4) {
    setTitleError('Journal name must be at least 4 characters long');
    return;
  }

  if (entry.length < 4) {
    setEntryError('Journal entry must be at least 4 characters long');
    return;
  }

  const payload = {
    name: title,
    journalLogs: [
      {
        message: entry
      }
    ]
  };

  try {
    await axios.post(`http://${JOURNAL_BFF_BASE_URL}/journal/logs`, payload);
    alert('Journal created successfully');
    const response = await axios.get(`http://${JOURNAL_BFF_BASE_URL}/journal/all`);
    setJournals(response.data);
    setModalOpen(false);
    setTitle('');
    setEntry('');
  } catch (error) {
    console.error('Error creating journal', error);
  }
};

const handleDelete = async (journalId, journalName) => {
  const confirmDelete = window.confirm(`Are you sure you want to delete the journal: ${journalName}?`);
  if (confirmDelete) {
    try {
      await axios.delete(`http://${JOURNAL_BFF_BASE_URL}/journal/${journalId}`);
      // After deleting the journal, fetch the updated list of journals
      const response = await axios.get(`http://${JOURNAL_BFF_BASE_URL}/journal/all`);
      setJournals(response.data);
    } catch (error) {
      console.error('Error deleting journal', error);
    }
  }
};

    const handleSort = (column) => {
      if (column === sortColumn) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortColumn(column);
        setSortDirection('desc');
      }
    };

  return (
  <Container>
  <Card className="p-4 shadow">
    <Card.Header className="text-center font-weight-bold display-4 card-header-no-bg">Journals</Card.Header>
    <Card.Body>
         <Button variant="primary" onClick={() => setModalOpen(true)} style={{ marginBottom: '10px' }}>
           <FontAwesomeIcon icon={faPlus} />
         </Button>
             <Modal show={modalOpen} onHide={() => setModalOpen(false)}>
               <Modal.Header closeButton>
                 <Modal.Title>Add Journal</Modal.Title>
               </Modal.Header>
               <Modal.Body>
                  <Form onSubmit={handleAddJournal}>
                    <Form.Group controlId="journalTitle">
                      <Form.Label>Title:</Form.Label>
                      <Form.Control type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter journal name (min. 4 characters)" />
                      {titleError && <p className="text-danger">{titleError}</p>}
                    </Form.Group>
                    <Form.Group controlId="journalEntry">
                      <Form.Label>Entry:</Form.Label>
                      <Form.Control as="textarea" value={entry} onChange={e => setEntry(e.target.value)} placeholder="Enter journal entry (min. 4 characters)" />
                      {entryError && <p className="text-danger">{entryError}</p>}
                    </Form.Group>
                    <br/>
                    <Button variant="primary" type="submit">Submit</Button>
                  </Form>
               </Modal.Body>
               <Modal.Footer>
                 <Button variant="secondary" onClick={() => setModalOpen(false)}>
                   Close
                 </Button>
                 <Button variant="primary" onClick={handleAddJournal}>
                   Add Journal
                 </Button>
               </Modal.Footer>
             </Modal>
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Journal Name</th>
          <th onClick={() => handleSort('updatedDate')}>Updated Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {journals
          .filter(journal => {
            if (searchFilter && !journal.name.toLowerCase().includes(searchFilter.toLowerCase())) {
              return false;
            }
            if (dateFilter && journal.updatedDate.split('T')[0] !== dateFilter) {
              return false;
            }
            return true;
          })
           .sort((a, b) => {
                          const comparison = new Date(a[sortColumn]) - new Date(b[sortColumn]);
                          return sortDirection === 'asc' ? comparison : -comparison;
                        })
          .map((journal, index) => {
            const updatedDate = new Date(journal.updatedDate);
            const formattedDate = updatedDate.toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              second: 'numeric',
              hour12: true
            });

            return (
              <tr key={journal.id}>
                <td>
                <OverlayTrigger
                        overlay={
                          <Tooltip id={`tooltip-${journal.id}`}>
                            {`${journal.journalLogs.length} logs`}
                          </Tooltip>
                        }
                      >
                        <span>{journal.name}</span>
                      </OverlayTrigger>
                </td>
                <td>{formattedDate}</td>
                <td>
              <Link to={`/log-journal/${journal.id}`}>
                <FontAwesomeIcon icon={faEye} />
              </Link> {" "}
                 <Button variant="danger" onClick={() => handleDelete(journal.id, journal.name)}>
                   <FontAwesomeIcon icon={faTrash} />
                 </Button>
                </td>
              </tr>
            );
          })}
      </tbody>
    </Table>
      </Card.Body>
    </Card>
    </Container>
  )};

export default AllJournals;