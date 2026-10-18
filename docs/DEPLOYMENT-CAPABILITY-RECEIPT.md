# Deployment Capability Receipt

This contract records what Pentaxis can currently claim about deployment targets. It is
**evidence metadata, not deployment automation**.

The three targets documented in the contract remain candidate paths:
- Cloudflare Pages/Workers
- Deno Deploy
- Cloud Run

A target can only become deployable after provider-specific runtime, adapter,
authentication callback, and generated output have been validated. The contract
records those requirements instead of treating documentation as proof.

## Authority boundary

This receipt:
- does not deploy anything;
- does not create provider projects;
- does not read or rotate secrets;
- does not grant production access;
- does not bypass the human promotion gate.

CI validates the receipt so drift in its authority boundary fails closed.
The normal typecheck, test, and production-build gates remain the application validation.
