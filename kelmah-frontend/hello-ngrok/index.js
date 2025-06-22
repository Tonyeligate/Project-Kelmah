const http = require('http');
const ngrok = require('@ngrok/ngrok');
const httpProxy = require('http-proxy');

// Create a proxy server
const proxy = httpProxy.createProxyServer({});

// Create webserver that proxies requests to the Vite dev server
const server = http.createServer((req, res) => {
	console.log(`Proxying request to: http://127.0.0.1:5173${req.url}`);
	proxy.web(req, res, { target: 'http://127.0.0.1:5173', changeOrigin: true });
});

// Proxy WebSocket requests for HMR
server.on('upgrade', (req, socket, head) => {
	console.log(`Proxying WebSocket request to: http://127.0.0.1:5173${req.url}`);
	proxy.ws(req, socket, head, { target: 'http://127.0.0.1:5173', changeOrigin: true });
});

server.listen(8080, () => console.log('Proxy server at 8080 is running...'));

// Get your endpoint online
ngrok.connect({ 
    addr: 8080, 
    authtoken: '2yUFFg3w76xCJHEZtEQ9TD7uWJ8_6k9bE8dTpyUMF1Ff5mtg1' 
})
.then(listener => console.log(`Ingress established at: ${listener.url()}`))
.catch(error => console.error('Error connecting to ngrok:', error));