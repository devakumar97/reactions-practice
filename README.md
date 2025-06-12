## 🔌 Feature: Realtime Socket Support (`feat/socket`)

### ✅ Summary

Implemented WebSocket support using `socket.io` to enable real-time communication features across the app.

---

### ⚙️ Tech Stack Used

* **Socket.IO**
* **Remix App Server Extension**
* **Custom Context Provider** (`context.tsx`)
* **Node Server Bootstrapping** (`server/index.ts`)

---

### 🔄 What Was Implemented

#### 1. **Custom Express-based Remix Server**

* Introduced `server/index.ts` to boot a custom server.
* Integrated **Socket.IO** with the Remix request handler.
* Supports both HTTP and WebSocket protocols.

#### 2. **Realtime Connections via Context**

* `utils/context.tsx` provides a React context that injects the socket instance into components.
* Components can listen for or emit events like:

  * `"user:connected"`
  * `"user:disconnected"`
  * `"user:typing"`
  * `"user:update"`

#### 3. **Dynamic User Routes**

* Route: `routes/users+/$username.tsx`
* Example usage: A "ping" button triggers the emit event and prints "pong"
* When the user visits their profile page, a `"join"` event is emitted to the server.

---

### 📂 Folder Structure

```bash
app/
├── root.tsx                   # Context provider wrapping the app
├── routes/users+/$username.tsx  # Emits/receives socket events
├── utils/context.tsx          # React Socket.IO client context
server/
└── index.ts                   # Custom Express server with Socket.IO
```

---

### 🧪 How to Test

1. Run the dev server with:

   ```bash
   npm run dev
   ```
2. Open two browser tabs with different users:

   * Navigate to `/users/deva`
   * Navigate to `/users/kumar`
3. You should see console logs (or UI updates) when users "join" or perform socket-based actions.

---

### 🧠 Why This Matters

* Introduces a foundation for **real-time features** like:

  * Chat
  * Notifications
  * Presence tracking
* Future-proofed with **context-based access** to socket anywhere in the app
* Easily extendable to support room-based channels, events, etc.

---
