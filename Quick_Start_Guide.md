# Policy Navigator - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- **Node.js**: Version 18 or higher
- **npm** or **yarn**: Package manager
- **Zynd Account**: Sign up at [Zynd Dashboard](https://dashboard.zynd.ai)
- **Git**: For version control

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd policy-navigator

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Create Agents in Zynd Dashboard

1. **Go to Zynd Dashboard**: https://dashboard.zynd.ai
2. **Create 4 agents** with these configurations:

#### Agent 1: Policy Interpreter
- **Name**: Policy Interpreter Agent
- **Capabilities**: `policy-analysis`, `rag`, `document-parsing`
- Save the DID, Seed, and Credential JSON

#### Agent 2: Eligibility Verifier
- **Name**: Eligibility Verifier Agent
- **Capabilities**: `credential-verification`, `rule-engine`, `eligibility-check`
- Save the DID, Seed, and Credential JSON

#### Agent 3: Citizen Agent
- **Name**: Citizen Agent
- **Capabilities**: `identity-management`, `credential-holder`
- Save the DID, Seed, and Credential JSON

#### Agent 4: Application Guide
- **Name**: Application Guide Agent
- **Capabilities**: `guidance`, `form-assistance`
- Save the DID, Seed, and Credential JSON

### Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your agent credentials
nano .env  # or use your preferred editor
```

**Fill in your agent credentials from Zynd Dashboard:**

```env
POLICY_INTERPRETER_DID=did:zynd:your_actual_did
POLICY_INTERPRETER_SEED=your_actual_seed
POLICY_INTERPRETER_CREDENTIAL={"id":"vc:...","type":"AgentCredential",...}

# Repeat for all 4 agents
```

### Step 4: Run the Application

```bash
# Option 1: Run both frontend and backend together
npm run dev

# Option 2: Run separately in different terminals
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 📁 Project Structure Explained

```
policy-navigator/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Header.jsx      # Top navigation bar
│   │   │   ├── AgentNetwork.jsx    # Left panel - Agent cards
│   │   │   ├── CitizenPanel.jsx    # Center panel - User interaction
│   │   │   └── AuditTimeline.jsx   # Right panel - Audit log
│   │   ├── App.jsx             # Main application component
│   │   ├── main.jsx            # React entry point
│   │   └── index.css           # Global styles
│   ├── index.html              # HTML template
│   ├── vite.config.js          # Vite configuration
│   ├── tailwind.config.js      # Tailwind CSS config
│   └── package.json            # Frontend dependencies
│
├── agents/                      # Autonomous AI agents
│   ├── policyInterpreter.js    # Analyzes policies using RAG
│   ├── eligibilityVerifier.js  # Verifies credentials + rule engine
│   ├── citizenAgent.js         # Manages citizen identity
│   └── applicationGuide.js     # Generates guidance
│
├── shared/                      # Shared utilities
│   ├── zyndClient.js           # Zynd agent initialization
│   ├── registry.js             # Capability-based discovery
│   ├── secureMessaging.js      # Encrypted MQTT
│   └── auditLogger.js          # Immutable audit log
│
├── policies/                    # Policy documents
│   └── old_age_pension.txt     # Sample policy
│
├── server.js                    # Backend orchestrator
├── package.json                 # Root dependencies
├── .env.example                 # Environment template
└── README.md                    # Documentation
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Backend server port | No (default: 5000) |
| `NODE_ENV` | Environment mode | No (default: development) |
| `POLICY_INTERPRETER_DID` | DID of policy agent | Yes |
| `POLICY_INTERPRETER_SEED` | Seed for policy agent | Yes |
| `POLICY_INTERPRETER_CREDENTIAL` | Credential JSON | Yes |
| `MQTT_BROKER` | MQTT broker URL | No (default: localhost) |

### Adding New Policies

1. Create a new `.txt` file in `policies/` directory
2. Follow the format of `old_age_pension.txt`
3. Agent will automatically load it on startup

### Customizing Agents

Each agent file (`agents/*.js`) can be customized:
- **Capabilities**: Modify `this.capabilities` array
- **Behavior**: Edit the processing methods
- **Rules**: Update rule engine logic in `eligibilityVerifier.js`

## 🧪 Testing the Application

### Manual Testing Flow

1. **Start the application**: `npm run dev`
2. **Verify agent initialization**: Check console for "Agent network ready!"
3. **Test query**: Enter "Am I eligible for old-age pension?"
4. **Watch the workflow**:
   - Left panel: Agent status changes (idle → discovering → active)
   - Center panel: Progress steps appear
   - Right panel: Audit logs accumulate
5. **Review result**: Eligibility decision with reasoning

### API Testing

```bash
# Health check
curl http://localhost:5000/health

# List agents
curl http://localhost:5000/api/agents

# Submit query
curl -X POST http://localhost:5000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Am I eligible for old-age pension?"}'

# Get audit log
curl http://localhost:5000/api/audit
```

## 🔒 Security Best Practices

### Development
- ✅ Never commit `.env` file
- ✅ Use `.env.example` for templates
- ✅ Rotate seeds regularly
- ✅ Test with demo credentials first

### Production
- ✅ Use environment-specific variables
- ✅ Enable MQTT authentication
- ✅ Set up HTTPS
- ✅ Implement rate limiting
- ✅ Add authentication layer
- ✅ Monitor audit logs

## 🐛 Troubleshooting

### Agents Not Initializing

**Problem**: "Failed to initialize agents" error

**Solutions**:
1. Verify DID format: `did:zynd:...`
2. Check credential JSON is valid
3. Ensure Zynd platform is accessible
4. Check network connectivity

```bash
# Test Zynd connectivity
curl https://api.zynd.ai/health
```

### MQTT Connection Failed

**Problem**: "MQTT connection error"

**Solutions**:
1. Verify MQTT broker URL in `.env`
2. Check firewall rules
3. Test broker connectivity:

```bash
# Install MQTT client
npm install -g mqtt

# Test connection
mqtt pub -h broker.zynd.ai -p 1883 -t "test" -m "hello"
```

### Frontend Not Loading

**Problem**: Blank page or errors

**Solutions**:
1. Check browser console for errors
2. Verify Vite is running: `cd frontend && npm run dev`
3. Clear browser cache
4. Check proxy configuration in `vite.config.js`

### Port Already in Use

**Problem**: "Port 5000 already in use"

**Solutions**:
```bash
# Find process using port
lsof -ti:5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 npm run server
```

## 📊 Monitoring and Logs

### Backend Logs
```bash
# View real-time logs
npm run server

# Look for:
# ✅ - Success indicators
# ❌ - Error indicators
# 🔍 - Discovery events
# 🔐 - Security events
```

### Audit Log Analysis
```bash
# Export audit logs
curl http://localhost:5000/api/audit > audit_log.json

# Analyze with jq
cat audit_log.json | jq '.logs | group_by(.agent)'
```

## 🚢 Deployment

### Docker Deployment (Recommended)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN cd frontend && npm install && npm run build
EXPOSE 5000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t policy-navigator .
docker run -p 5000:5000 --env-file .env policy-navigator
```

### Cloud Deployment

**Heroku**:
```bash
heroku create policy-navigator
heroku config:set POLICY_INTERPRETER_DID=...
git push heroku main
```

**AWS EC2**:
```bash
# SSH into instance
ssh -i key.pem ubuntu@your-instance

# Setup
git clone <repo>
npm install
npm run install-all

# Run with PM2
npm install -g pm2
pm2 start server.js
pm2 startup
```

## 🎯 Next Steps

### Enhancements
1. **Add More Policies**: Create additional policy documents
2. **Extend Agents**: Add new capabilities
3. **Improve RAG**: Integrate LLM for better policy analysis
4. **Add Authentication**: Secure the application
5. **Real-time Updates**: Use WebSocket for live updates

### Integration
1. **Connect Real Zynd Platform**: Use actual Zynd API
2. **Issue Real Credentials**: Integrate with credential issuers
3. **External APIs**: Connect to government databases
4. **Blockchain**: Add immutable audit trail

## 📚 Additional Resources

- **Zynd Documentation**: https://docs.zynd.ai
- **React Documentation**: https://react.dev
- **Vite Documentation**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com
- **MQTT Protocol**: https://mqtt.org

## 🤝 Support

For issues and questions:
- **GitHub Issues**: <repo-url>/issues
- **Email**: support@example.com
- **Discord**: Join our community

## 📄 License

MIT License - See LICENSE file for details


