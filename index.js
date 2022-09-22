import { inbox, outbox } from 'file-transfer';
import { encode } from 'cbor';

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
        outbox.enqueue(MESSAGE_FILE_NAME, encode(data))
            .catch(err => {
                for (let handler of eventHandlers.error) {
                    handler(`Error queueing transfer: ${err}`)
                }
            });
    },

}

const otherFiles = [];
const myFiles = [];

if (inbox.pop) { // this is a companion
    const prevPop = inbox.pop;

    const init = () => {
        inbox.addEventListener("newfile", processCompanionFiles);
        processCompanionFiles();
    }

    const processCompanionFiles = async (evt) => {

        let file = await getNextMyFile();
        if (file === undefined) return;

        const payload = {};
        payload.data = await file.cbor();

        onMessage(payload)
    }

    inbox.pop = async () => {
        if (otherFiles.length > 0) {
            return otherFiles.pop();
        }
        let file;
        while (file = await prevPop()) {
            if (file.name === MESSAGE_FILE_NAME) {
                myFiles.push(file)
            }
            else {
                return file;
            }
        }
        return undefined;
    }

    const getNextMyFile = async () => {
        if (myFiles.length > 0) {
            return myFiles.pop()
        }
        let file;
        while (file = await prevPop()) {
            if (file.name === MESSAGE_FILE_NAME) {
                return file;
            }
            otherFiles.push(file);
        }
        return undefined;
    }

    init();




} else { // this is a device
    const { readFileSync } = require("fs");
    const prevNextFile = inbox.nextFile;

    const init = () => {
        inbox.addEventListener("newfile", processDeviceFiles);
        processDeviceFiles();
    }

    const processDeviceFiles = (evt) => {

        let fileName = getNextMyFile();
        if (fileName === undefined) return;

        const payload = {};
        payload.data = readFileSync(fileName, "cbor");

        onMessage(payload)
    }

    inbox.nextFile = () => {
        if (otherFiles.length > 0) {
            return otherFiles.pop();
        }
        let fileName;
        while (fileName = prevNextFile()) {
            if (fileName === MESSAGE_FILE_NAME) {
                myFiles.push(fileName)
            }
            else {
                return fileName;
            }
        }
        return undefined;
    }

    const getNextMyFile = () => {
        if (myFiles.length > 0) {
            return myFiles.pop()
        }
        let fileName;
        while (fileName = prevNextFile()) {
            if (fileName === MESSAGE_FILE_NAME) {
                return fileName;
            }
            otherFiles.push(fileName);
        }
        return undefined;
    }

    init()

}

setTimeout(() => { onOpen(); }, 1)