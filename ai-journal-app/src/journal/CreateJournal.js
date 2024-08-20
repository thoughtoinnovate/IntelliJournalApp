import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Row, Card, Col } from 'react-bootstrap';
import './css/CreateJournal.css';
import { JOURNAL_BFF_BASE_URL } from '../configs/config';

function CreateJournal() {
  const [title, setTitle] = useState('');
  const [entry, setEntry] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: title,
      journalLogs: [
        {
          message: entry
        }
      ]
    };

    try {
       const response = await axios.post(`http://${JOURNAL_BFF_BASE_URL}/journal/logs`, payload);
      alert('Journal created successfully');
      navigate(`/log-journal/${response.data.id}`);
    } catch (error) {
      console.error('Error creating journal', error);
    }
  };

  return (
      <Container className="d-flex justify-content-center journal-container">
        <Row>
          <Col className="p-4 shadow journal-card">
            <Card className="p-4 shadow journal-card">
              <Card.Header className="text-center font-weight-bold display-4 card-header-no-bg">New Journal</Card.Header>
              <Form onSubmit={handleSubmit}>
      <Form.Group controlId="journalTitle">
        <Form.Label>Title:</Form.Label>
        <Form.Control type="text" value={title} onChange={e => setTitle(e.target.value)} />
      </Form.Group>
      <Form.Group controlId="journalEntry">
        <Form.Label>Entry:</Form.Label>
        <Form.Control as="textarea" value={entry} onChange={e => setEntry(e.target.value)} />
      </Form.Group>
       <br/>
      <Button variant="primary" type="submit">Submit</Button>
              </Form>
            </Card>
          </Col>
        </Row>
      </Container>
  );
}

export default CreateJournal;