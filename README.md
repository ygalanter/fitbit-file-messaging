Drop-in replacement for Fitbit peer socket messaging - just replace the imports (in both app and companion)
```diff
- import * as messaging from 'messaging';
+ import * as messaging from 'fitbit-file-messaging';
```

```js
messaging.peerSocket.onmessage = evt => {
    // this code doesn't change
}
```
```js
messaging.peerSocket.addEventListener('open', evt => {
    // this code doesn't change
})
```

This messaging uses file transfer under the hood, so it's more reliable than regular messaging.

**Note**: If you use file transfer in your own application, you need to use `inbox` from this library as well to listen for specific file you need e.g.

```js
// app
messaging.inbox.addFileListener('myfile.cbor', fileName => {
    const data = readFileSync(fileName, 'cbor');
})
```
```js
// companion
messaging.inbox.addFileListener('myfile.cbor', file => {
    file.cbor().then( ... )
})
```
