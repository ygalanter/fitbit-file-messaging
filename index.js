import { inbox as fileInbox, outbox as fileOutbox } from 'file-transfer';
import { encode } from 'cbor';


// Additional inbox handlers for users who use file-transfer in their own apps
const userFileHandlers = {
    device: [],
    companion: []
}


export const inbox = {
    // adds additional file inbox handlers - props: { fileName, callback }
    // when inbox encounters "fileName" it will call "callback"
    addFileListener: function (fileName, callback) {
        if (fileInbox.pop) { // this is a companion
            userFileHandlers.companion.push({ fileName, callback })
        } else { // this is a device
            userFileHandlers.device.push({ fileName, callback })
        }
    }
}

const MESSAGE_FILE_NAME = 'messaging4d9b79c40abe.cbor';

// event handler for messages
const eventHandlers = {
    message: [],
    open: [],
    close: [],
    error: []
}

// when incoming data arrives - calls all "onmessage" handlers and passes the data
function onMessage(payload) {
    for (let handler of eventHandlers.message) {
        handler(payload)
    }
}

// on app start calls all "onopen" handlers
function onOpen() {
    for (let handler of eventHandlers.open) {
        handler()
    }
}

export const peerSocket = {

    // *** Setters for manual event handler assignments
    set onmessage(handler) {
        eventHandlers.message.push(handler);
    },

    set onopen(handler) {
        eventHandlers.open.push(handler);
    },

    set onclose(handler) {
        eventHandlers.close.push(handler);
    },

    set onerror(handler) {
        eventHandlers.error.push(handler);
    },
    // ***


    readyState: 0,
    OPEN: 0,

    addEventListener: function (event, handler) {
        eventHandlers[event].push(handler)
    },

    // simulation of `messaging.peerSocket.send` - sends data externally
    // from device to phone or from phone to device via file transfer
    send: function (data) {
        fileOutbox.enqueue(MESSAGE_FILE_NAME, encode(data))
            .catch(err => {
                for (let handler of eventHandlers.error) {
                    handler(`Error queueing transfer: ${err}`)
                }
            });
    },

}


if (fileInbox.pop) { // this is a companion

    async function processCompanionFiles() {
        let file;
        let payload = {}

        while ((file = await fileInbox.pop())) {
            if (file.name === MESSAGE_FILE_NAME) {
                payload.data = await file.cbor();
                onMessage(payload)
            }

            // processing user handlers
            for (let prop of userFileHandlers.companion) {
                if (file.name === prop.fileName) {
                    prop.callback(file)
                }
            }
        }
    }

    fileInbox.addEventListener("newfile", processCompanionFiles);

    processCompanionFiles();

} else { // this is a device
    const { readFileSync } = require("fs");

    async function processDeviceFiles() {
        let fileName;
        let payload = {};

        while (fileName = fileInbox.nextFile()) {
            if (fileName === MESSAGE_FILE_NAME) {
                payload.data = readFileSync(fileName, 'cbor');
                onMessage(payload)
            }

            // processing user handlers
            for (let prop of userFileHandlers.device) {
                if (fileName === prop.fileName) {
                    prop.callback(fileName)
                }
            }
        }
    }

    fileInbox.addEventListener("newfile", processDeviceFiles)

    processDeviceFiles();

}

setTimeout(() => { onOpen(); }, 1)