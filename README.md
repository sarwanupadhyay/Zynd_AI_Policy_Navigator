# Policy Navigator – Trusted AI for Public Benefit Access

## Overview
Policy Navigator is a trust-native, multi-agent AI system designed to help citizens discover, verify, and apply for public benefits. It replaces confusing bureaucracy with a network of verified AI agents that interpret policy documents, verify eligibility using credentials, and guide applications with full transparency and auditability.

This is not a chatbot.  
This is a governed system of autonomous AI agents built for public good.

---

## Problem Statement
Citizens often miss benefits they are legally entitled to because:
- Policies are complex and difficult to interpret
- Eligibility rules are fragmented across programs
- Applications require navigating unclear bureaucratic processes
- Sharing sensitive documents creates privacy and trust risks

As a result, people fail to access welfare, pensions, subsidies, and social programs.

---

## Our Solution
Policy Navigator creates a **trusted citizen-assistant network** where AI agents:

- Interpret policy documents in plain language  
- Verify eligibility using **verifiable credentials (VCs)** instead of raw documents  
- Match benefits across programs  
- Guide applications and appeals with full auditability  

The system ensures:
- Minimal data sharing
- Explainable decisions
- Cryptographically verifiable trust between agents

---

## System Architecture

### Agents
- **Policy Interpreter Agent**  
  Uses RAG over official policy documents to extract:
  - Program name
  - Eligibility rules
  - Plain-language summary
  - Citations from the corpus

- **Eligibility Verifier Agent**  
  Applies a rule engine (JSON-based) to evaluate whether criteria are satisfied.

- **Credential Verifier Agent**  
  Verifies citizen claims (age, residency, income) as **verifiable credentials (VCs)** rather than requesting raw documents.

- **Application Guide Agent**  
  Generates step-by-step instructions, form guidance, and appeal options.

---

## Core Demo Flow

1. **Citizen Query**  
   “What benefits can I get?”

2. **Policy Interpretation**  
   Policy Interpreter extracts relevant programs and rules from official policy documents.

3. **Eligibility Verification**  
   Eligibility Verifier requests only required claims (age, income, residency).  
   Citizen shares minimal credential data using VCs.

4. **Trust Validation**  
   Credential Verifier checks issuer authenticity and claim integrity.

5. **Decision Output**  
   System returns:
   - Qualified programs
   - Clear “why” reasoning
   - What evidence was verified
   - Next steps for application or appeal

---

## Key Features

- **Privacy-First**: No raw documents; only verified claims are shared.
- **Explainable AI**: Every eligibility decision includes reasoning.
- **Auditability**: All agent actions are logged.
- **Trust Layer**: Agent identity and credential verification ensure reliability.
- **Scalable**: Can extend across multiple government programs and jurisdictions.

---

## Technology Stack

- Multi-Agent Architecture
- Retrieval-Augmented Generation (RAG)
- Rule-based Eligibility Engine (JSON)
- Verifiable Credentials (VCs)
- Secure Agent Communication
- React (Frontend UI)
- Node.js (Backend Orchestration)

---

## Why This Matters

Policy Navigator demonstrates how AI can be:
- Transparent instead of opaque
- Trustworthy instead of black-box
- Citizen-centric instead of bureaucratic

It shows a real-world path to responsible AI in public services.

---

## Future Scope
- Integration with live government portals
- Multi-language support
- Cross-agency benefit matching
- Real credential issuers (universities, banks, local authorities)

---

## How to Run (Prototype)
1. Clone the repository  
2. Configure environment variables  
3. Start agent services  
4. Run the frontend  
5. Ask: “What benefits can I get?”  

---

## Core Message
**This is not a chatbot.  
This is a network of verified AI agents that collaborate with trust, privacy, and accountability by design.**
