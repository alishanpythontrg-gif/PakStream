#!/bin/bash

# Simple Edge Server Starter for PakStream
# This script helps you test the edge server system on Ubuntu

echo "======================================"
echo "PakStream Edge Server Starter"
echo "======================================"
echo ""

# Step 1: Create edge server directories
echo "Step 1: Creating edge server directories..."
mkdir -p edge-5001/backend
mkdir -p edge-5002/backend
mkdir -p edge-5003/backend

# Step 2: Copy backend files
echo "Step 2: Copying backend files..."
cp -r backend/src edge-5001/backend/
cp -r backend/src edge-5002/backend/
cp -r backend/src edge-5003/backend/
cp backend/package.json edge-5001/backend/
cp backend/package.json edge-5002/backend/
cp backend/package.json edge-5003/backend/

# Step 3: Create .env files for each edge server
echo "Step 3: Creating configuration files..."

cat > edge-5001/backend/.env << 'EOF'
PORT=5001
MONGODB_URI=mongodb://localhost:27017/pakstream
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
ADMIN_REGISTRATION_KEY=admin123
NODE_ENV=development
EOF

cat > edge-5002/backend/.env << 'EOF'
PORT=5002
MONGODB_URI=mongodb://localhost:27017/pakstream
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
ADMIN_REGISTRATION_KEY=admin123
NODE_ENV=development
EOF

cat > edge-5003/backend/.env << 'EOF'
PORT=5003
MONGODB_URI=mongodb://localhost:27017/pakstream
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
ADMIN_REGISTRATION_KEY=admin123
NODE_ENV=development
EOF

# Step 4: Install dependencies
echo "Step 4: Installing dependencies (this may take a moment)..."
cd edge-5001/backend && npm install --silent && cd ../..
cd edge-5002/backend && npm install --silent && cd ../..
cd edge-5003/backend && npm install --silent && cd ../..

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "To start the edge servers, open separate terminal windows:"
echo ""
echo "Terminal 1 - Origin Server:"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 - Edge Server 1:"
echo "  cd edge-5001/backend && npm start"
echo ""
echo "Terminal 3 - Edge Server 2:"
echo "  cd edge-5002/backend && npm start"
echo ""
echo "Terminal 4 - Edge Server 3:"
echo "  cd edge-5003/backend && npm start"
echo ""
echo "Then register them in the admin dashboard!"

