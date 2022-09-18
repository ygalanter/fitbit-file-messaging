import { inbox, outbox } from 'file-transfer';
import { encode } from 'cbor';

const MESSAGE_FILE_NAME = 'messaging4d9b79c40abe.cbor';

const eventHandlers = {
    message: [],
    open: []
}

export const peerSocket = {

    set onmessage(handler) {
        eventHandlers.message.push(handler);
    },

    set onopen(handler) {
        eventHandlers.open.push(handler);
    },

    readyState: 0,
    OPEN: 0,

    addEventListener: function (event, handler) {
        eventHandlers[event].push(handler)
    },

    // simulation of `messaging.peerSocket.send` - sends data externally
    // from device to phone or from phone to device via file transfer
    send: function (data) {
        outbox.enqueue(MESSAGE_FILE_NAME, encode(data))
            .catch(err => {
                console.error(`#@#@#@#@# Failed to queue '${MESSAGE_FILE_NAME}'. Error: ${err}`);
            });

    },

    // simulation of `messaging.peerSocket.onMessage` event
    sendLocal: function (payload) {
        for (let handler of eventHandlers.message) {
            handler(payload)
        }
    },

    // simulation of `messaging.peerSocket.onMessage` event
    openLocal: function () {
        for (let handler of eventHandlers.open) {
            handler()
        }
    }

}


if (inbox.pop) { // this is a companion

    inbox.addEventListener("newfile", async () => {
        let file;
        let payload = {}

        while ((file = await inbox.pop())) {
            if (file.name === MESSAGE_FILE_NAME) {
                payload.data = await file.cbor();
                peerSocket.sendLocal(payload)
            }
        }
    })

} else { // this is a device
    const { readFileSync } = require("fs");

    inbox.addEventListener("newfile", async () => {
        let fileName;
        let payload = {};

        while (fileName = inbox.nextFile()) {
            if (fileName === MESSAGE_FILE_NAME) {
                payload.data = readFileSync(fileName, 'cbor');
                peerSocket.sendLocal(payload)
            }
        }
    })

}



setTimeout(() => { peerSocket.openLocal(); }, 1)
