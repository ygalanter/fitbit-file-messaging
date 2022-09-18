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