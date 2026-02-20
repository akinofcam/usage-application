# Face Recognition Implementation Guide

This document outlines how to implement full face recognition support using native macOS APIs for the Usage app.

## Overview

The current implementation has placeholder support for face recognition (using the "facelock" method). To implement full face recognition, you'll need to use native Node.js bindings to macOS Vision framework or integrate a third-party service.

## Option 1: Native macOS Vision Framework (Recommended)

### Using node-faceapi or similar

```bash
npm install node-faceapi
```

### Implementation Steps

1. **Create a face recognition module** (`src/facelock.js`)

```javascript
import faceapi from 'node-faceapi';

export class FaceLock {
  async enrollFace(userId) {
    // Capture face from camera and store embedding
  }

  async verifyFace(userId) {
    // Capture face from camera and verify against stored embedding
    // Return confidence score
  }

  async unlockPath(filePath) {
    // Verify face and return access token
  }
}
```

2. **Update security.js** to use FaceLock

```javascript
if (row.protection_method === 'facelock') {
  const faceLock = new FaceLock();
  const verified = await faceLock.verifyFace(filePath);
  resolve({ authorized: verified, message: verified ? 'Face verified' : 'Face not recognized' });
}
```

3. **Create camera access UI** in ui.html

```html
<div id="camera-feed" style="display: none;">
  <video id="video" width="400" height="300"></video>
  <button onclick="captureAndVerify()">Verify Face</button>
</div>
```

## Option 2: Touch ID / Biometric Authentication (Easiest)

Since macOS has built-in TouchID on most modern Macs:

```bash
npm install mac-biometric-authenticate
```

```javascript
import { authenticate } from 'mac-biometric-authenticate';

export async function verifyBiometric() {
  try {
    await authenticate('Verify to unlock');
    return true;
  } catch (error) {
    return false;
  }
}
```

## Option 3: Third-Party Services

- **Amazon Rekognition**: https://aws.amazon.com/rekognition/
- **Google Cloud Vision API**: https://cloud.google.com/vision
- **Microsoft Face API**: https://azure.microsoft.com/en-us/services/cognitive-services/face/

## Implementation Timeline

### Phase 1: TouchID Support (Quick Win)
- 2-3 hours
- Use system-level authentication
- Most user-friendly
- Works on all modern Macs

### Phase 2: Basic Face Recognition
- 1-2 days
- Integrate node-faceapi
- Camera permission handling
- Face enrollment UI

### Phase 3: Advanced Features
- 1 week
- Multi-face support
- Liveness detection
- Access logs with photos

## Security Considerations

1. **Never store raw face data** - Only store encrypted embeddings
2. **Use secure storage** - Encrypt database with native encryption
3. **Camera permissions** - Ask for explicit user permission
4. **Face verification thresholds** - Set high confidence requirements (95%+)
5. **Fallback authentication** - Always provide password backup

## Testing Face Recognition

```javascript
// test/facelock.test.js
import { FaceLock } from '../src/facelock.js';

describe('FaceLock', () => {
  let faceLock;

  beforeEach(() => {
    faceLock = new FaceLock();
  });

  test('should enroll face successfully', async () => {
    const result = await faceLock.enrollFace('user1');
    expect(result.success).toBe(true);
  });

  test('should verify enrolled face', async () => {
    await faceLock.enrollFace('user1');
    const result = await faceLock.verifyFace('user1');
    expect(result.verified).toBe(true);
  });
});
```

## Current Placeholder Implementation

The app currently returns:
```javascript
{
  authorized: false,
  message: 'Face recognition verification required - please use native app',
  requiresFaceVerification: true
}
```

To enable full face recognition, implement one of the above options and update `src/security.js` line 115-119.

## Resources

- [FaceAPI.js Documentation](https://github.com/justadudewhohacks/face-api.js)
- [macOS Permission Handling](https://developer.apple.com/documentation/avfoundation/avcapturesession)
- [Electron Security Best Practices](https://www.electronjs.org/docs/tutorial/security)
- [TouchID in Node.js](https://github.com/theryaz/mac-biometric-authenticate)

## Next Steps

1. Choose your implementation option
2. Create a feature branch
3. Implement face verification
4. Add comprehensive tests
5. Update UI/UX for face enrollment
6. Submit PR with security audit

---

Questions? Check the main README.md for more information.
