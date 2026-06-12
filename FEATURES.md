# FlagFoundry Platform Features

This document describes the product features included in the FlagFoundry cybersecurity training platform. For setup commands, use `README.md`.

## Product Overview

FlagFoundry is a local cybersecurity training platform inspired by guided CTF and lab platforms. Users log in, choose a room, start an isolated vulnerable machine, use a browser-based Kali terminal, complete tasks, unlock hints, submit flags, and track progress.

The app is designed for local training first. It intentionally includes vulnerable containers, so the lab runtime should not be exposed directly to the public internet.

## Core Feature Map

| Area | Status | Notes |
| --- | --- | --- |
| User registration/login | Implemented | JWT-based auth with student/admin roles. |
| Dashboard | Implemented | Shows points, rank, streak, completed rooms, task count, and running labs. |
| Leaderboard | Implemented | Ranks users by points and streak. |
| Room library | Implemented | Lists seeded training rooms with difficulty, category, points, and running/completed states. |
| Room detail pages | Implemented | Shows tasks, target IP, Kali IP, quick commands, flags, terminal, and writeup form. |
| Docker lab start/stop | Implemented | Backend creates per-user Docker networks and starts target + Kali containers. |
| Browser terminal | Implemented | xterm.js frontend connects over WebSocket to the running Kali container. |
| Flags | Implemented | SHA-256 hashed flag validation with points and room completion. |
| Hints | Implemented | Users unlock hints by spending points. Unlocked hints stay visible. |
| Task progress | Implemented | Users can check tasks as complete. Points are awarded once per task. |
| Learning paths | Seeded | Paths exist in the database and rooms are grouped into paths. Dedicated UI can be expanded. |
| Writeups | Implemented | Users can submit writeups for rooms. Admin can review/approve. |
| Admin room creation | Implemented | Admin users can create basic room records from the admin panel. |
| VPN config generation | Scaffolded | Generates `.ovpn` templates, but real PKI/OpenVPN server integration is not complete. |
| Production deployment | Not hardened | Needs worker isolation, real secrets, cleanup jobs, and stronger network controls. |

## User System

### Authentication

Users can register and log in with email/password credentials. The backend issues JWTs, and the frontend stores the token for authenticated API calls.

Seeded accounts:

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@flagfoundry.local` | `StudentPass123!` |
| Admin | `admin@flagfoundry.local` | `AdminPass123!` |

### User Stats

Each user has:

- Points
- Streak
- Rank
- Completed rooms
- Completed tasks
- Running lab instances
- Recent successful flag captures

### Leaderboard

The leaderboard orders users by:

1. Points
2. Streak

This gives learners a lightweight gamified progression loop.

## Dashboard

The dashboard is the learner’s home screen. It shows:

- Current rank
- Completed room count
- Completed task count
- Running lab count
- Recent captured flags
- VPN config download action

The dashboard copy and layout are designed to make the next action clear: pick a mission, start a lab, capture a flag.

## Room System

Rooms are the main training units. Each room includes:

- Title
- Description
- Difficulty
- Category/type
- Point value
- Docker image name
- Tasks
- Hints
- Flags
- User progress
- Running lab state

Room types currently used:

- Linux fundamentals
- Web exploitation
- Privilege escalation
- CTF challenge

## Included Rooms

### Linux Basic Foothold

Beginner Linux/SSH room.

Skills:

- Nmap service enumeration
- SSH login
- Weak credential use
- `sudo -l`
- Misconfigured sudo command abuse

### Web Exploitation Playground

Intentionally unsafe PHP web app.

Skills:

- Web route discovery
- SQL injection simulation
- XSS demonstration
- Local file inclusion

### Privilege Escalation Box

Linux privilege escalation room.

Skills:

- Local enumeration
- SUID binary discovery
- Writable scheduled job abuse
- Root flag recovery

### Legacy Service Enumeration

Service enumeration challenge with legacy-style services.

Skills:

- FTP enumeration
- Samba enumeration
- SSH discovery
- Risk documentation

### Login Bypass Basics

Beginner web login bypass room.

Skills:

- Login form testing
- SQL-style auth bypass concept
- Flag discovery after bypass

### Linux File Permissions

Beginner Linux permissions room.

Skills:

- SSH access
- `find`
- `ls -l`
- World-readable sensitive file discovery

### Writable Cron Misconfiguration

Privilege escalation through writable maintenance scripts.

Skills:

- Cron inspection
- Writable script discovery
- Privileged file copy

### API IDOR Challenge

Small JSON API with insecure direct object reference.

Skills:

- API route mapping
- Object ID manipulation
- Broken access control discovery

## Lab Runtime

When a user starts a room, the backend:

1. Finds the room’s Docker image.
2. Creates or reuses a per-user isolated Docker network.
3. Starts the vulnerable target container.
4. Starts a Kali attacker container.
5. Stores IP addresses and container names in the database.
6. Returns the instance state to the frontend.

The frontend then shows:

- Target IP
- Kali IP
- Running status
- Suggested starter commands

Example commands:

```bash
nmap -sV TARGET_IP
ssh trainee@TARGET_IP
```

## Browser Terminal

The browser terminal uses:

- xterm.js on the frontend
- WebSocket connection to the backend
- Docker exec session into the user’s Kali container

If no Kali container is running for the selected room, the UI tells the learner to start the room first.

The Kali image includes common training tools such as:

- `nmap`
- `gobuster`
- `sqlmap`
- `john`
- `hydra`
- `nikto`
- `curl`
- `netcat`
- `ftp`
- SSH client

## Flags

Flags use the format:

```text
FLAG{example_value}
```

The database stores SHA-256 hashes of flag values instead of plaintext values.

When a user submits a flag:

1. Backend checks the format.
2. Backend hashes the submitted value.
3. Backend compares it to room flag hashes.
4. If correct, the user receives points.
5. The room is marked complete.
6. The correct submission is recorded.

Points are only awarded once per correct flag.

## Tasks

Each room has ordered task cards. Tasks include:

- Title
- Markdown-compatible instructions
- Point value
- Completion state
- Hints

Users can click **Check** to mark a task complete. Task points are awarded once, even if the user clicks again.

## Hints

Hints are attached to tasks.

Each hint has:

- Hint text
- Point cost
- Unlock state

When a learner unlocks a hint:

1. Points are deducted once.
2. Hint text becomes visible.
3. The hint remains unlocked on future room visits.

## Writeups

Users can submit a writeup after or during a room.

Writeups include:

- Title
- Body
- User
- Room
- Approval status

Admins can view submitted writeups and approve them.

## Admin Features

Admin users can access the admin panel.

Current admin features:

- View rooms
- Create room records
- Set room slug/title/description/type/difficulty/image/flag
- View submitted writeups
- Approve writeups through the backend route

The admin panel is intentionally simple and can be expanded into a full content-management workflow.

## Docker Isolation Model

The backend creates per-user lab networks.

Current intent:

- Vulnerable containers are not publicly exposed.
- Kali and target containers share the user’s private lab network.
- The browser reaches targets through the Kali terminal workflow.
- Target containers have tighter runtime restrictions.
- Kali containers receive extra network capabilities needed for tools like `nmap`.

Current resource controls include:

- Memory limits
- CPU limits
- PID limits
- Dropped capabilities for target containers
- `no-new-privileges` for target containers

## VPN Feature Status

The VPN feature is currently a scaffold.

Implemented:

- Per-user subnet field
- OpenVPN profile template
- Config generation endpoint
- Download action in dashboard

Not yet complete:

- Real OpenVPN server container
- PKI / EasyRSA certificate generation
- Per-user client certificates
- Routing from VPN clients to lab networks
- Revocation
- Production-grade network firewall rules

For local usage, VPN is not required.

## Data Model Summary

Main database models:

- `User`
- `LearningPath`
- `Room`
- `Task`
- `Hint`
- `Flag`
- `LabInstance`
- `RoomProgress`
- `TaskProgress`
- `FlagSubmission`
- `HintUnlock`
- `Writeup`

Prisma schema location:

```text
db/schema.prisma
```

Seed file:

```text
db/seed.js
```

## Security Notes

This app is intentionally dangerous if exposed incorrectly.

Important boundaries:

- Do not expose vulnerable container ports publicly.
- Do not expose Docker socket access.
- Do not run untrusted user-supplied images without stronger sandboxing.
- Do not reuse default seed passwords in any shared environment.
- Replace `JWT_SECRET` before serious deployment.
- Add cleanup jobs for abandoned lab instances.
- Add stricter admin audit logging before team usage.

## Future Feature Ideas

Good next improvements:

- Dedicated learning path UI
- Room search/filtering
- Per-room walkthrough mode
- Better admin editor for tasks/hints/flags
- Auto-stop labs after inactivity
- Lab time limits
- User profile page
- Achievement badges
- Room ratings
- Public/private writeups
- Real VPN/WireGuard integration
- Lab worker queue
- Kubernetes or Firecracker-backed lab isolation
- Browser-based web preview proxy for target web apps
- Instructor mode for classrooms

