import { useEffect, useRef } from 'react';

const useWebSocket = (url, onMessage) => {
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  useEffect(() => {
	const connectWebSocket = () => {
	  if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
		console.log('Attempting to connect to WebSocket...');
		ws.current = new WebSocket(url);

		ws.current.onopen = () => {
		  console.log('WebSocket connection established');
		  if (reconnectTimeout.current) {
			clearTimeout(reconnectTimeout.current);
			reconnectTimeout.current = null;
		  }
		};

		ws.current.onmessage = (message) => {
		  console.log('WebSocket Message Received:', message.data);
		  onMessage(JSON.parse(message.data));
		};

		ws.current.onclose = () => {
		  console.log('WebSocket connection closed, attempting to reconnect...');
		  if (!reconnectTimeout.current) {
			reconnectTimeout.current = setTimeout(connectWebSocket, 1000); // Attempt to reconnect after 1 second
		  }
		};

		ws.current.onerror = (error) => {
		  console.error('WebSocket error:', error);
		  ws.current.close();
		};
	  }
	};

	connectWebSocket();

	return () => {
	  if (ws.current) {
		ws.current.close();
	  }
	  if (reconnectTimeout.current) {
		clearTimeout(reconnectTimeout.current);
	  }
	};
  }, [url, onMessage]);

  return ws.current;
};

export default useWebSocket;