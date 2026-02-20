# Network Troubleshooting Guide

## Problem: "Site cannot be reached" or "Connection timeout"

### ✅ Solution 1: Server Binding (FIXED)
The server has been updated to bind to `0.0.0.0` instead of `localhost`. This allows access from other devices.

**Restart your backend server:**
```bash
cd backend
npm start
```

---

### ✅ Solution 2: Check Windows Firewall

**Windows Firewall might be blocking port 3000:**

1. **Open Windows Defender Firewall:**
   - Press `Win + R`
   - Type `wf.msc` and press Enter

2. **Create Inbound Rule:**
   - Click "Inbound Rules" → "New Rule"
   - Select "Port" → Next
   - Select "TCP" and enter port `3000` → Next
   - Select "Allow the connection" → Next
   - Check all profiles (Domain, Private, Public) → Next
   - Name it "Node.js Port 3000" → Finish

**OR Quick Method (Command Prompt as Administrator):**
```bash
netsh advfirewall firewall add rule name="Node.js Port 3000" dir=in action=allow protocol=TCP localport=3000
```

---

### ✅ Solution 3: Verify Server is Running

**Check if server is accessible locally:**
```bash
curl http://localhost:3000/api/health
```

Should return: `{"status":"success","message":"Civic Connect API is running"}`

**Check if server is accessible from network IP:**
```bash
curl http://172.21.161.251:3000/api/health
```

---

### ✅ Solution 4: Verify Network Connection

**Ensure both devices are on the same network:**
- Your computer and phone must be on the same Wi-Fi network
- Check your phone's Wi-Fi settings
- Try pinging your computer from phone (if possible)

---

### ✅ Solution 5: Check Antivirus/Firewall Software

**Third-party antivirus/firewall might be blocking:**
- Check Windows Defender Firewall
- Check any third-party antivirus (Norton, McAfee, etc.)
- Temporarily disable to test, then add exception

---

### ✅ Solution 6: Verify IP Address

**Make sure IP address is correct:**

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (Wi-Fi or Ethernet)

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Update if IP changed:**
- Edit `apps/mobile/src/config/api.ts`
- Update `API_BASE_URL` with correct IP

---

### ✅ Solution 7: Test from Computer's Browser

**Test from your computer's browser:**
```
http://172.21.161.251:3000/api/health
```

If this works on your computer but not on phone:
- ✅ Server is running correctly
- ❌ Firewall is blocking external access
- Fix: Add firewall rule (Solution 2)

---

### ✅ Solution 8: Check Server Logs

**When you start the server, you should see:**
```
🚀 Server running on port 3000
📱 API available at http://localhost:3000/api
🌐 Network access: http://172.21.161.251:3000/api
```

If you see errors, check:
- Port 3000 is not already in use
- MongoDB connection (if needed)
- Any other errors in console

---

## Quick Checklist

- [ ] Server is running (`npm start` in backend folder)
- [ ] Server shows "Network access: http://172.21.161.251:3000/api"
- [ ] Firewall allows port 3000 (Windows Firewall)
- [ ] Phone and computer on same Wi-Fi network
- [ ] IP address is correct (172.21.161.251)
- [ ] Test from computer browser works
- [ ] Test from phone browser works

---

## Still Not Working?

1. **Try different port:**
   - Change `PORT` in backend to 3001
   - Update firewall rule for new port
   - Update API URL in mobile app

2. **Use ngrok for testing:**
   ```bash
   npm install -g ngrok
   ngrok http 3000
   ```
   Use the ngrok URL (e.g., `https://abc123.ngrok.io/api`) in your app

3. **Deploy backend online:**
   - Use Railway, Render, or Heroku
   - Update API URL to deployed URL
   - No firewall issues!

---

## Common Error Messages

**"ERR_CONNECTION_REFUSED":**
- Server not running OR firewall blocking

**"ERR_CONNECTION_TIMED_OUT":**
- Firewall blocking OR wrong IP address

**"This site can't be reached":**
- Wrong IP address OR not on same network
