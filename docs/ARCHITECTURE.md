# Gym Arena – KJU Architecture

## Web Application

```text
Browser
  ↓
HTML / CSS / Vanilla JavaScript
  ↓ fetch() / JSON
Node.js + Express REST API
  ↓
MySQL (persistent application data)
```

Node.js serves both the REST API and the static frontend from the same origin at `http://localhost:3000`.

## DSA Practical Layer

```text
JavaDSA/*.java
  ↓ javac
Standalone Java console programs
  ↓
Custom data structures / algorithms
```

The Java programs do not require Apache Tomcat, Node.js or MySQL.

## Security/Access Decisions

- Passwords are hashed with bcryptjs.
- Login state is held in an HTTP-only JWT cookie.
- User registration requires the college username pattern `YYMCA<SECTION><ROLL>` such as `26MCAD14`.
- New registrations are pending until admin approval.
- The initial password equals the username only because this is an explicit project requirement; users must replace it at first login.
- Admin operations are role-protected.
- Coin updates and major admin actions are recorded in wallet/audit logs.

## Scope Boundary

This is a mini-project, so it intentionally avoids external payment gateways, microservices, cloud queues, AI medical advice, social-media feeds and enterprise SSO infrastructure.
