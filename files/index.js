const http = require('http');
const net = require('net');
const { WebSocket, createWebSocketStream } = require('ws');
const logcb = (...args) => console.log.bind(this, ...args);
const errcb = (...args) => console.error.bind(this, ...args);
const dyid = ('3d3ecd10-381d-3224-9570-3f0b7df524d3').replace(/-/g, "");
const port = 8080;

const httpServer = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello, World\n');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found\n');
  }
});

httpServer.listen(port, () => {
  console.log(`HTTP port ${port}`);
});


const wss = new WebSocket.Server({ server: httpServer });
wss.on('connection', ws => {
  console.log("WebSocket ok");
  ws.on('message', msg => {
    if (msg.length < 18) {
      console.error("msg error");
      return;
    }
    try {
      const [VERSION] = msg;
      const yd = msg.slice(1, 17);
      if (!yd.every((v, i) => v == parseInt(dyid.substr(i * 2, 2), 16))) {
        console.error("dyID error");
        return;
      }
      let i = msg.slice(17, 18).readUInt8() + 19;
      const dyport = msg.slice(i, i += 2).readUInt16BE(0);
      const DATYP = msg.slice(i, i += 1).readUInt8();
      const dyhost = DATYP === 1 ? msg.slice(i, i += 4).join('.') :
        (DATYP === 2 ? new TextDecoder().decode(msg.slice(i + 1, i += 1 + msg.slice(i, i + 1).readUInt8())) :
          (DATYP === 3 ? msg.slice(i, i += 16).reduce((s, b, i, a) => (i % 2 ? s.concat(a.slice(i - 1, i + 1)) : s), []).map(b => b.readUInt16BE(0).toString(16)).join(':') : ''));
      console.log('connection:', dyhost, dyport);
      ws.send(new Uint8Array([VERSION, 0]));
      const dyduplex = createWebSocketStream(ws);
      net.connect({ host: dyhost, port: dyport }, function () {
        this.write(msg.slice(i));
        dyduplex.on('error', err => console.error("E1:", err.message)).pipe(this).on('error', err => console.error("E2:", err.message)).pipe(dyduplex);
      }).on('error', err => console.error("connection error:", err.message));
    } catch (err) {
      console.error("dyduplex error:", err.message);
    }
  }).on('error', err => console.error("WebSocket error:", err.message));
});
