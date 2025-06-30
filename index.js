const net = require('net');
const WebSocket = require('ws');
const logdy = (...args) => console.log.bind(this, ...args);
const errdy = (...args) => console.error.bind(this, ...args);
const dyid = ('3d3ecd10-381d-3224-9570-3f0b7df524d3').replace(/-/g, '');
const port = 8080;
const dwss = new WebSocket.Server({ port }, logdy('listen:', port));
dwss.on('connection', ws => {
    ws.once('message', msg => {
        const [VERSION] = msg;
        const yd = msg.slice(1, 17);
        if (!yd.every((v, i) => v === parseInt(dyid.substr(i * 2, 2), 16))) return;
        let i = msg.slice(17, 18).readUInt8() + 19;
        const dyPort = msg.slice(i, i += 2).readUInt16BE(0);
        const DATYP = msg.slice(i, i += 1).readUInt8();
        const dyHost = DATYP === 1 ? msg.slice(i, i += 4).join('.') : 
            (DATYP === 2 ? new TextDecoder().decode(msg.slice(i + 1, i += 1 + msg.slice(i, i + 1).readUInt8())) : 
                (DATYP === 3 ? msg.slice(i, i += 16).reduce((s, b, i, a) => (i % 2 ? s.concat(a.slice(i - 1, i + 1)) : s), []).map(b => b.readUInt16BE(0).toString(16)).join(':') : '')); 
        ws.send(new Uint8Array([VERSION, 0]));
        const dyplex = WebSocket.createWebSocketStream(ws);
        net.connect({ host: dyHost, port: dyPort }, function () {
            this.write(msg.slice(i));
            dyplex.on('error', errdy()).pipe(this).on('error', errdy()).pipe(dyplex);
        }).on('error', errdy());
    }).on('error', errdy());
});

