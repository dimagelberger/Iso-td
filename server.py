#!/usr/bin/env python3
"""Static file server with correct JS MIME types for ES modules."""
import http.server
import socketserver

PORT = 5500

class Handler(http.server.SimpleHTTPRequestHandler):
    # Explicit MIME type map so Windows registry gaps don't break ES modules.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js':   'application/javascript',
        '.mjs':  'application/javascript',
        '.json': 'application/json',
        '.css':  'text/css',
        '.html': 'text/html',
        '.glb':  'model/gltf-binary',
    }

    def log_message(self, fmt, *args):
        # Keep server output clean — only print status + path.
        print(f'{args[0]}  {args[1]}  {args[2]}')

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', PORT), Handler) as httpd:
    print(f'Serving H:/Claude/iso-td at http://localhost:{PORT}')
    httpd.serve_forever()
