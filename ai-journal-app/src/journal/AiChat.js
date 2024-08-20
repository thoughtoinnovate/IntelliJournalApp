import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, ProgressBar, Spinner } from 'react-bootstrap';
import './css/JournalAnalytics.css';
import { AiOutlineStop } from 'react-icons/ai'; // Import stop icon
import { AiOutlineCopy } from 'react-icons/ai'; // Import stop icon
import { ToastContainer, toast } from 'react-toastify'; // Import ToastContainer and toast
import 'react-toastify/dist/ReactToastify.css';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import './css/aichat.css';
import { JOURNAL_BFF_BASE_URL } from '../configs/config';

function AiChat({ llmURL }) {
  const [inputValue, setInputValue] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [spinLoad, setSpinLoad] = useState(false);
  const [initialLoad, setInitialLoad] = useState(0.1);
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const abortController = useRef(null);
  const [aiOutboxFormat, setAIOutboxFormat] = useState('text');

  if (!llmURL) {
    llmURL = `http://${JOURNAL_BFF_BASE_URL}/ai/generateStream`;
  }

  
  useEffect(() => {
    // Fetch dropdown options from API
    fetch(`http://${JOURNAL_BFF_BASE_URL}/ollama/models`)
      .then(response => response.json())
      .then(data => {
        setDropdownOptions(data);
        if (data.length > 0) {
          setSelectedModel(data[0]); // Set the first option as the default selected model
        }
      })
      .catch(error => console.error('Error fetching dropdown options:', error));
      mermaid.initialize({ startOnLoad: true });
  }, []);

  const Mermaid = ({ chart }) => {
    useEffect(() => {
      mermaid.contentLoaded();
    }, [chart]);
  
    return (
      <div className="mermaid">
        {chart}
      </div>
    );
  };
  
  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      if (match && match[1] === 'mermaid') {
        return <Mermaid chart={String(children).replace(/\n$/, '')} />;
      }
      return <pre><code className={className} {...props}>{children}</code></pre>;
    }
  };

  const handleAbort = () => {

    try {
      if (abortController.current) {
        abortController.current.abort();  // Abort the fetch request
        abortController.current = null; // Reset the AbortController
      }
    } catch (error) {
      console.error('Error aborting data', error);
    } finally {
      setSpinLoad(false);
      setLoading(false); // End loading
    }
  };

  const handleClick = () => {


    // Create a new AbortController for the new fetch request
    abortController.current = new AbortController();
    var i = 1;
    setSpinLoad(true);
    setInitialLoad(i);
    setLoading(true); // Start loading
    setResponse(''); // Clear the output text box
    const format = aiOutboxFormat;
    const aiPrompt=`aiPrompt=${inputValue}&model=${selectedModel}&respFormat=${format}`;
    const encodedAiPrompt = encodeURI(aiPrompt);

    fetch(`${llmURL}?${encodedAiPrompt}`, { signal: abortController.current.signal })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.body;
      })
      .then(rb => {
        const reader = rb.getReader();
        return new ReadableStream({
          start(controller) {
            function push() {
              // Check if the fetch request was aborted before reading the next chunk
              if (abortController.current.signal && abortController.current.signal.aborted) {
                console.log('Fetch aborted');
                controller.error('Fetch operation was aborted');
                return;
              }

              reader.read().then(({ done, value }) => {

                if (done) {
                  controller.close();
                  setInitialLoad(100);
                  setLoading(false); // End loading
                  setSpinLoad(false);
                  return;
                } else {
                  setInitialLoad(i);
                  if (i > 70) {
                    i = 70;
                  } else {
                    i++;
                  }

                }

                controller.enqueue(value);
                if (abortController.current.signal && abortController.current.signal.aborted) {
                  console.log('Fetch aborted after reading a chunk');
                  controller.error('Fetch operation was aborted');
                  return;
                }
                setResponse(prevResponse => prevResponse + new TextDecoder().decode(value));
                push();

              }).catch(err => {
                console.error('Error reading from stream', err);
                controller.error(err);
              });
            }

            push();
          }
        });
      })
      .catch(error => {
        if (error.name === 'AbortError') {
          console.log('Fetch request was aborted');
          setLoading(false); // End loading
          setInputValue(''); // Clear the input text box
          setSpinLoad(false);
        } else {
          console.error('Error fetching data', error);

        }
      });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response).then(() => {
      toast.success('Text copied to clipboard!');
    }).catch(err => {
      toast.error('Failed to copy text.');
    });
  };

  const renderAIResponse = (response) => {
    if (aiOutboxFormat === 'html') {
      return <span dangerouslySetInnerHTML={{ __html: response }} />;
}else if (aiOutboxFormat === 'markdown') {
  return <ReactMarkdown components={components}>{response}</ReactMarkdown>;
}else {
   return  <label>{response}</label>;
}
  }
 
  return (
    <Container>
      <Row>
        <Col className='p-4 shadow ai-card'>
          <Card>
            <div className='model-dropdown'>
        <Form.Select
      value={selectedModel}
      onChange={(e) => setSelectedModel(e.target.value)}>
            <option value="" disabled>Select a model</option>
            {dropdownOptions.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </Form.Select>
          </div>

            <Card.Body>
            <Card.Header className="text-center font-weight-bold display-4 card-header-no-bg">Ask Me!</Card.Header>
            <Form>
              <Form.Group className="textarea-button-wrapper">
                <Form.Control as="textarea" value={inputValue} onChange={e => setInputValue(e.target.value)} />
                <br />
                <Button onClick={handleClick} disabled={loading}>Ask</Button>
                <Button onClick={handleAbort} disabled={!loading}><AiOutlineStop /></Button> {/* Add the stop button */}
              </Form.Group>
            </Form>
            <br />
            {spinLoad ? <Spinner animation="border" /> : ""}
            <br />
            <ProgressBar now={initialLoad ? initialLoad : (loading ? "100" : "0")} max="100" />
            <br />

            <Row className="mb-3 align-items-center">
            <Col>
              <select
                id="format-select"
                onChange={(e) => {
                  const value = e.target.value;
                  setAIOutboxFormat(value);
                }}
                className="form-control"
                style={{ width: '150px' }}
              >
                <option value="plain">Plain Text</option>
                <option value="html">HTML</option>
                <option value="markdown">Markdown</option>
              </select>
              </Col>
              <Col xs="1">
              <AiOutlineCopy onClick={handleCopy} style={{ cursor: 'pointer', marginLeft: '10px' }} /> {/* Copy icon */}
              </Col>
            </Row>

            <Card.Text className="scrollable-text">
              
            {renderAIResponse(response)}

            </Card.Text>
                  </Card.Body>
          </Card>
          </Col>
      </Row>
   
    </Container>

  );
}

export default AiChat;