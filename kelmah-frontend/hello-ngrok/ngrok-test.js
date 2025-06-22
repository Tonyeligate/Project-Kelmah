const http = require('http');
const ngrok = require('@ngrok/ngrok');

// Create webserver
http.createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'http://localhost:5173/' });
	res.end('Congrats you have created an ngrok web server');
}).listen(8080, () => console.log('Node.js web server at 8080 is running...'));

// Get your endpoint online
ngrok.connect({ 
    addr: 8080, 
    authtoken: '2yUFFg3w76xCJHEZtEQ9TD7uWJ8_6k9bE8dTpyUMF1Ff5mtg1' 
})
.then(listener => console.log(`Ingress established at: ${listener.url()}`))
.catch(error => console.error('Error connecting to ngrok:', error)); 