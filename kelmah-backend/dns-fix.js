/**
 * DNS Resolution Fix for Node.js 25+
 * Forces DNS resolution through Google Public DNS (8.8.8.8) when the local
 * DNS server cannot resolve MongoDB Atlas SRV records.
 * 
 * Load this BEFORE any other requires via: node -r ./dns-fix.js server.js
 * Or require it at the top of start-*.js scripts.
 */
'use strict';

const dns = require('dns');

// Set Google DNS as the resolver so Atlas SRV lookups succeed
// even when the local network DNS cannot resolve them.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
