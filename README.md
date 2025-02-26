## react-webllm

> [!WARNING]
> This is a work in progress, breaking changes guaranteed.

**react-webllm** is a library that lets you easily bring [WebLLM](https://webllm.mlc.ai/) 
into your react apps.

### Example

Just wrap your components with a provider:

```typescript
import React, { useState, useEffect } from 'react';
import { LLMProvider, useLLM } from 'react-webllm';

const App = () => {
  return (
    <LLMProvider autoInitialize={true}>
      <Chat />
    </LLMProvider>
  );
}
```

...and in another component called `Chat` you can:

```typescript
const Chat = () => {
  ...
  const { generate, initialized, initProgress, systemInfo } = useLLM();
  ...
}
```

## Prior Art

This project wouldn't have been possible without the [WebLLM](https://webllm.mlc.ai/) 
high-performance in-browser LLM inference engine.
