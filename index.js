import { inbox, outbox } from 'file-transfer';
import { encode } from 'cbor';

const MESSAGE_FILE_NAME = 'messaging4d9b79c40abe.cbor';

export const peerSocket = {

    readyState: 0,
    OPEN: 0,

    addEventListener: function (event, eventHandler) {
        this[event] = eventHandler;
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

        if (this.message) {
            this.message(payload)
        } else if (this.onmessage) {
            this.onmessage(payload)
        }

    },

    // simulation of `messaging.peerSocket.onMessage` event
    openLocal: function () {
        if (this.open) {
            this.open()
        } else if (this.onopen) {
            this.onopen()
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
    import('fs').then(fs => {
        inbox.addEventListener("newfile", async () => {
            let fileName;
            let payload = {};

            while (fileName = inbox.nextFile()) {
                if (fileName === MESSAGE_FILE_NAME) {
                    payload.data = fs.readFileSync(fileName, 'cbor');
                    peerSocket.sendLocal(payload)
                }
            }
        })
    })
}



setTimeout(() => { peerSocket.openLocal(); }, 1)
