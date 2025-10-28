#!/bin/bash

# Edge Server Simulator for PakStream
# Simulates multiple edge servers on a single Ubuntu machine

echo "=========================================="
echo "PakStream Edge Server Simulator"
echo "=========================================="
echo ""

# Configuration
ORIGIN_PORT=5000
EDGE_PORTS=(5001 5002 5003)
SIMULATOR_DIR="./edge-simulator"

# Create simulator directory
mkdir -p $SIMULATOR_DIR

echo "This script will simulate edge servers on your Ubuntu machine."
echo "It will run multiple instances of PakStream on different ports."
echo ""
echo "Origin Server: http://localhost:$ORIGIN_PORT"
echo "Edge Servers:"
for port in "${EDGE_PORTS[@]}"; do
    echo "  - Edge Server on port $port"
done
echo ""

read -p "Do you want to continue? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "Cancelled."
    exit 0
fi

# Function to create edge server instance
create_edge_server() {
    local port=$1
    local server_dir="$SIMULATOR_DIR/edge-$port"
    
    echo "Creating edge server on port $port..."
    
    # Create edge server directory
    mkdir -p $server_dir/backend/src
    mkdir -p $server_dir/uploads
    
    # Copy backend files
    cp -r backend/src/* $server_dir/backend/src/
    
    # Create .env for edge server
    cat > $server_dir/backend/.env << EOF
PORT=$port
MONGODB_URI=mongodb://localhost:27017/pakstream
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
ADMIN_REGISTRATION_KEY=admin123
NODE_ENV=development
EDGE_SERVER_MODE=true
EDGE_SERVER_API_KEY=edge-$port-secret-key
EOF

    # Create edge server startup script
    cat > $server_dir/start-edge.sh << 'EDGEOF'
#!/bin/bash
cd backend
npm start
EDGEOF

    chmod +x $server_dir/start-edge.sh
    
    echo "Edge server on port $port created in $server_dir"
}

# Install dependencies for edge servers
install_dependencies() {
    echo "Installing dependencies for edge servers..."
    for port in "${EDGE_PORTS[@]}"; do
        local server_dir="$SIMULATOR_DIR/edge-$port"
        if [ -d "$server_dir/backend" ]; then
            echo "Installing dependencies for edge-$port..."
            cd $server_dir/backend
            npm install --silent
            cd ../..
        fi
    done
}

# Start all edge servers
start_edge_servers() {
    echo ""
    echo "Starting edge servers..."
    echo ""
    
    for port in "${EDGE_PORTS[@]}"; do
        local server_dir="$SIMULATOR_DIR/edge-$port"
        if [ -d "$server_dir" ]; then
            echo "Starting edge server on port $port..."
            cd $server_dir
            ./start-edge.sh > edge-server-$port.log 2>&1 &
            echo $! > edge-server-$port.pid
            cd ../..
            sleep 2
        fi
    done
    
    echo ""
    echo "Edge servers started!"
    echo ""
    echo "Servers running:"
    for port in "${EDGE_PORTS[@]}"; do
        echo "  - Edge Server: http://localhost:$port"
    done
    echo ""
    echo "Logs are in: $SIMULATOR_DIR/edge-*/edge-server-*.log"
    echo "PID files are in: $SIMULATOR_DIR/edge-*/edge-server-*.pid"
}

# Stop all edge servers
stop_edge_servers() {
    echo "Stopping edge servers..."
    for port in "${EDGE_PORTS[@]}"; do
        local pid_file="$SIMULATOR_DIR/edge-$port/edge-server-$port.pid"
        if [ -f "$pid_file" ]; then
            pid=$(cat $pid_file)
            if ps -p $pid > /dev/null 2>&1; then
                kill $pid
                echo "Stopped edge server on port $port (PID: $pid)"
            fi
            rm $pid_file
        fi
    done
    echo "All edge servers stopped."
}

# Create edge servers
echo "Step 1: Creating edge server instances..."
for port in "${EDGE_PORTS[@]}"; do
    create_edge_server $port
done

# Install dependencies
echo ""
echo "Step 2: Installing dependencies..."
install_dependencies

# Ask user if they want to start servers
echo ""
read -p "Do you want to start the edge servers now? (y/n): " start_servers

if [ "$start_servers" = "y" ]; then
    start_edge_servers
    
    echo ""
    echo "=========================================="
    echo "Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Start your origin server: cd backend && npm run dev"
    echo "2. Open admin dashboard in browser"
    echo "3. Go to Edge Server Management section"
    echo "4. Register each edge server with these details:"
    echo ""
    for port in "${EDGE_PORTS[@]}"; do
        echo "   Edge Server $port:"
        echo "   - Name: Edge Server $port"
        echo "   - Host: localhost"
        echo "   - Port: $port"
        echo "   - Protocol: http"
        echo "   - API Key: edge-$port-secret-key"
        echo ""
    done
    echo "5. Edge servers will automatically receive videos"
    echo ""
    echo "To stop edge servers, run: ./simulate-edge-servers.sh stop"
else
    echo ""
    echo "Edge servers created but not started."
    echo "To start them later, run: ./simulate-edge-servers.sh start"
fi

# Handle stop command
if [ "$1" = "stop" ]; then
    stop_edge_servers
    exit 0
fi

if [ "$1" = "start" ]; then
    start_edge_servers
    exit 0
fi

