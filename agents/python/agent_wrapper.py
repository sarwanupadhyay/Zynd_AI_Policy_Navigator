"""
Python Agent Wrapper using Real Zynd AI Agent Package
Bridges Python agents with Node.js server
"""

import os
import json
import asyncio
from typing import Dict, List, Any
from zyndai_agent import Agent, AgentConfig
from dotenv import load_dotenv

load_dotenv()


class PolicyInterpreterAgent:
    """Policy Interpreter Agent using real Zynd package"""
    
    def __init__(self):
        self.config = AgentConfig(
            did=os.getenv('POLICY_INTERPRETER_DID'),
            seed=os.getenv('POLICY_INTERPRETER_SEED'),
            credential=json.loads(os.getenv('POLICY_INTERPRETER_CREDENTIAL')),
            capabilities=['policy-analysis', 'rag', 'document-parsing']
        )
        self.agent = None
        self.name = "Policy Interpreter Agent"
        
    async def initialize(self):
        """Initialize agent with Zynd platform"""
        self.agent = Agent(self.config)
        await self.agent.initialize()
        await self.agent.register()  # Register with Zynd registry
        print(f"✅ {self.name} initialized with DID: {self.config.did}")
        
    async def analyze_policy(self, query: str) -> Dict[str, Any]:
        """Analyze policy documents"""
        # Use real Zynd agent capabilities
        policy_data = await self.agent.query_documents(
            query=query,
            document_type='policy',
            use_rag=True
        )
        
        return {
            'id': policy_data.get('policy_id'),
            'name': policy_data.get('name'),
            'summary': policy_data.get('summary'),
            'eligibilityCriteria': policy_data.get('criteria', []),
            'requiredClaims': policy_data.get('required_claims', [])
        }
    
    async def verify_sender(self, sender_did: str) -> bool:
        """Verify sender DID using Zynd"""
        return await self.agent.verify_did(sender_did)


class EligibilityVerifierAgent:
    """Eligibility Verifier Agent using real Zynd package"""
    
    def __init__(self):
        self.config = AgentConfig(
            did=os.getenv('ELIGIBILITY_VERIFIER_DID'),
            seed=os.getenv('ELIGIBILITY_VERIFIER_SEED'),
            credential=json.loads(os.getenv('ELIGIBILITY_VERIFIER_CREDENTIAL')),
            capabilities=['credential-verification', 'rule-engine', 'eligibility-check']
        )
        self.agent = None
        self.name = "Eligibility Verifier Agent"
        
    async def initialize(self):
        """Initialize agent with Zynd platform"""
        self.agent = Agent(self.config)
        await self.agent.initialize()
        await self.agent.register()
        print(f"✅ {self.name} initialized with DID: {self.config.did}")
        
    async def verify_credentials(self, credentials: List[Dict]) -> bool:
        """Verify credentials using Zynd"""
        for cred in credentials:
            is_valid = await self.agent.verify_credential(cred)
            if not is_valid:
                return False
        return True
    
    async def check_eligibility(self, policy_info: Dict, credentials: List[Dict]) -> Dict:
        """Check eligibility using rule engine"""
        # Verify credentials first
        verified = await self.verify_credentials(credentials)
        
        if not verified:
            return {
                'decision': 'Not Eligible',
                'reason': 'Credential verification failed'
            }
        
        # Execute rules
        results = await self.agent.execute_rules(
            rules=policy_info['eligibilityCriteria'],
            data=credentials
        )
        
        return {
            'decision': 'Eligible' if results['all_satisfied'] else 'Not Eligible',
            'evaluations': results['evaluations'],
            'reasoning': results['reasoning'],
            'verifiedBy': self.config.did
        }


class CitizenAgent:
    """Citizen Agent using real Zynd package"""
    
    def __init__(self):
        self.config = AgentConfig(
            did=os.getenv('CITIZEN_AGENT_DID'),
            seed=os.getenv('CITIZEN_AGENT_SEED'),
            credential=json.loads(os.getenv('CITIZEN_AGENT_CREDENTIAL')),
            capabilities=['identity-management', 'credential-holder']
        )
        self.agent = None
        self.name = "Citizen Agent"
        self.credentials = []
        
    async def initialize(self):
        """Initialize agent with Zynd platform"""
        self.agent = Agent(self.config)
        await self.agent.initialize()
        await self.agent.register()
        
        # Load citizen's verifiable credentials
        self.credentials = await self.agent.load_credentials()
        print(f"✅ {self.name} initialized with {len(self.credentials)} credentials")
        
    async def share_selective_claims(self, requested_claims: List[str]) -> Dict:
        """Share only requested claims - privacy preserving"""
        shared = []
        shared_creds = []
        
        for claim in requested_claims:
            cred = await self.agent.find_credential_for_claim(claim)
            if cred:
                # Use Zynd's selective disclosure
                disclosed = await self.agent.selective_disclose(
                    credential=cred,
                    claims=[claim]
                )
                shared.append(f"{claim}: {disclosed['value']}")
                shared_creds.append(disclosed['credential'])
        
        # Get all available claims for privacy demo
        all_claims = await self.agent.list_available_claims()
        not_shared = [c for c in all_claims if c not in requested_claims]
        
        return {
            'shared': shared,
            'notShared': not_shared,
            'credentials': shared_creds,
            'disclosedBy': self.config.did
        }


class ApplicationGuideAgent:
    """Application Guide Agent using real Zynd package"""
    
    def __init__(self):
        self.config = AgentConfig(
            did=os.getenv('APPLICATION_GUIDE_DID'),
            seed=os.getenv('APPLICATION_GUIDE_SEED'),
            credential=json.loads(os.getenv('APPLICATION_GUIDE_CREDENTIAL')),
            capabilities=['guidance', 'form-assistance']
        )
        self.agent = None
        self.name = "Application Guide Agent"
        
    async def initialize(self):
        """Initialize agent with Zynd platform"""
        self.agent = Agent(self.config)
        await self.agent.initialize()
        await self.agent.register()
        print(f"✅ {self.name} initialized with DID: {self.config.did}")
        
    async def generate_guidance(self, eligibility_result: Dict) -> Dict:
        """Generate application guidance"""
        # Use Zynd's knowledge base
        guidance = await self.agent.query_knowledge_base(
            query=f"application_process_{eligibility_result['decision']}",
            context=eligibility_result
        )
        
        return {
            'decision': eligibility_result['decision'],
            'steps': guidance.get('steps', []),
            'documents': guidance.get('required_documents', []),
            'timeline': guidance.get('timeline'),
            'generatedBy': self.config.did
        }


# Main workflow orchestrator
class AgentOrchestrator:
    """Orchestrates multi-agent workflow using real Zynd agents"""
    
    def __init__(self):
        self.policy_agent = PolicyInterpreterAgent()
        self.verifier_agent = EligibilityVerifierAgent()
        self.citizen_agent = CitizenAgent()
        self.guide_agent = ApplicationGuideAgent()
        
    async def initialize_all(self):
        """Initialize all agents"""
        await asyncio.gather(
            self.policy_agent.initialize(),
            self.verifier_agent.initialize(),
            self.citizen_agent.initialize(),
            self.guide_agent.initialize()
        )
        print("🚀 All agents initialized with real Zynd platform")
        
    async def process_query(self, query: str) -> Dict:
        """Process citizen query through multi-agent workflow"""
        workflow = []
        
        try:
            # Step 1: Discover and analyze policy
            workflow.append({'step': 'discovery', 'status': 'started'})
            policy_info = await self.policy_agent.analyze_policy(query)
            workflow.append({'step': 'discovery', 'status': 'complete'})
            
            # Step 2: Request credentials
            workflow.append({'step': 'credentials', 'status': 'started'})
            disclosure = await self.citizen_agent.share_selective_claims(
                policy_info['requiredClaims']
            )
            workflow.append({'step': 'credentials', 'status': 'complete'})
            
            # Step 3: Verify eligibility
            workflow.append({'step': 'eligibility', 'status': 'started'})
            result = await self.verifier_agent.check_eligibility(
                policy_info,
                disclosure['credentials']
            )
            workflow.append({'step': 'eligibility', 'status': 'complete'})
            
            # Step 4: Generate guidance
            workflow.append({'step': 'guidance', 'status': 'started'})
            guidance = await self.guide_agent.generate_guidance(result)
            workflow.append({'step': 'guidance', 'status': 'complete'})
            
            return {
                'success': True,
                'workflow': workflow,
                'credentialRequest': {
                    'requestedClaims': policy_info['requiredClaims'],
                    'requestedBy': self.verifier_agent.config.did
                },
                'disclosure': disclosure,
                'eligibilityResult': {
                    **result,
                    'nextSteps': guidance['steps']
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'workflow': workflow
            }


# Flask API to expose Python agents to Node.js
from flask import Flask, request, jsonify

app = Flask(__name__)
orchestrator = None


@app.route('/api/python/init', methods=['POST'])
async def init_agents():
    """Initialize all agents"""
    global orchestrator
    orchestrator = AgentOrchestrator()
    await orchestrator.initialize_all()
    return jsonify({'status': 'initialized'})


@app.route('/api/python/query', methods=['POST'])
async def process_query():
    """Process citizen query"""
    data = request.json
    result = await orchestrator.process_query(data['query'])
    return jsonify(result)


@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'using_real_zynd': True
    })


if __name__ == '__main__':
    print("🐍 Starting Python Agent Service with Real Zynd Package...")
    app.run(port=5001, debug=True)