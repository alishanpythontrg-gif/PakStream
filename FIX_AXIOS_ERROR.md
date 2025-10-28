# How to Fix the Axios Error

## The Problem

You're getting this error:
```
Error: Cannot find module 'axios'
```

## The Solution

**Run this command in your terminal:**

```bash
cd backend
npm install axios
```

Then restart your server:

```bash
npm run dev
```

---

## Alternative: If npm install doesn't work

Try removing node_modules and reinstalling:

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

---

## Quick Fix Script

I've created a script for you. Run:

```bash
chmod +x install-axios.sh
./install-axios.sh
```

---

## After Installing Axios

1. Your edge servers will show "active" status
2. Health checks will work
3. Video sync will function properly

---

## Summary

✅ Axios is already added to package.json  
⚠️ You just need to run `npm install axios` in the backend directory  
✅ Then restart your server  

That's it!

