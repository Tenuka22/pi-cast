# 📖 Operational Runbooks

Standard operating procedures for pi-cast operations.

---

## 📋 Table of Contents

1. [Incident Response](#incident-response)
2. [Database Operations](#database-operations)
3. [User Management](#user-management)
4. [Content Moderation](#content-moderation)
5. [Performance Issues](#performance-issues)
6. [Security Incidents](#security-incidents)
7. [Backup & Recovery](#backup--recovery)

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 | Complete outage | Immediate |
| P1 | Major feature broken | 1 hour |
| P2 | Minor feature broken | 4 hours |
| P3 | Cosmetic issue | 24 hours |

### Incident Response Flow

```
1. Detect → 2. Triage → 3. Respond → 4. Resolve → 5. Review
```

### P0/P1 Incident Checklist

- [ ] Acknowledge incident in #incidents channel
- [ ] Assign incident commander
- [ ] Create incident document
- [ ] Assess impact and scope
- [ ] Communicate to stakeholders
- [ ] Implement fix or workaround
- [ ] Verify resolution
- [ ] Schedule post-mortem

---

## Database Operations

### Daily Health Check

```bash
# Check database size
sqlite3 sqlite.db "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();"

# Check table sizes
sqlite3 sqlite.db "SELECT name, pgsize_asize(quote(name)) FROM sqlite_master WHERE type='table';"

# Check for corrupted data
sqlite3 sqlite.db "PRAGMA integrity_check;"
```

### Adding Database Index

```bash
# Run index script
cd packages/db
bun run db:index

# Verify indexes
sqlite3 sqlite.db ".indexes"
```

### Database Migration

```bash
# Generate migration
cd packages/db
bun run db:generate

# Review migration
cat drizzle/0000_*.sql

# Apply migration
bun run db:push

# Verify
bun run db:studio
```

### Database Backup

```bash
# Manual backup
cp packages/db/sqlite.db packages/db/sqlite.db.backup.$(date +%Y%m%d)

# Verify backup
sqlite3 packages/db/sqlite.db.backup.* "PRAGMA integrity_check;"
```

### Restore from Backup

```bash
# Stop application
pm2 stop all

# Restore backup
cp packages/db/sqlite.db.backup.YYYYMMDD packages/db/sqlite.db

# Verify
sqlite3 packages/db/sqlite.db "PRAGMA integrity_check;"

# Restart application
pm2 start all
```

---

## User Management

### Ban User

```bash
# Via admin panel
1. Go to Admin Dashboard → Users
2. Find user
3. Click Actions → Ban User
4. Enter reason
5. Confirm

# Via database (emergency only)
sqlite3 packages/db/sqlite.db "UPDATE user SET banned=1, ban_reason='Reason' WHERE id='user-id';"
```

### Unban User

```bash
# Via admin panel
1. Go to Admin Dashboard → Users
2. Find banned user
3. Click Actions → Unban User
4. Confirm

# Via database
sqlite3 packages/db/sqlite.db "UPDATE user SET banned=0, ban_reason=NULL WHERE id='user-id';"
```

### Delete User Account

```bash
# Soft delete (recommended)
1. Ban user first
2. Anonymize personal data:
   sqlite3 packages/db/sqlite.db "UPDATE user SET name='Deleted User', email='deleted@deleted.local' WHERE id='user-id';"

# Hard delete (permanent!)
# WARNING: This cannot be undone
sqlite3 packages/db/sqlite.db "DELETE FROM user WHERE id='user-id';"
```

### Reset User Session

```bash
# Revoke all user sessions
sqlite3 packages/db/sqlite.db "DELETE FROM session WHERE user_id='user-id';"

# User will need to log in again
```

---

## Content Moderation

### Review Reported Content

```bash
# Via admin panel
1. Go to Admin Dashboard → Reports
2. Review reported content
3. Take action:
   - Approve (no action needed)
   - Remove content
   - Warn user
   - Ban user (severe cases)
```

### Remove Lesson

```bash
# Soft delete (recommended)
1. Go to Admin Dashboard → Lessons
2. Find lesson
3. Click Actions → Archive

# Via database
sqlite3 packages/db/sqlite.db "UPDATE lesson SET status='archived' WHERE id='lesson-id';"
```

### Restore Archived Lesson

```bash
# Via admin panel
1. Go to Admin Dashboard → Lessons
2. Filter by status: archived
3. Find lesson
4. Click Actions → Publish

# Via database
sqlite3 packages/db/sqlite.db "UPDATE lesson SET status='published' WHERE id='lesson-id';"
```

---

## Performance Issues

### High API Response Times

```bash
# Check current response times
curl -w "@curl-format.txt" -o /dev/null -s https://api.pi-cast.com/health

# curl-format.txt contents:
# time_namelookup:  %{time_namelookup}\n
# time_connect:     %{time_connect}\n
# time_starttransfer: %{time_starttransfer}\n
# time_total:       %{time_total}\n
```

#### Diagnosis

1. Check server logs for slow queries
2. Review database query performance
3. Check for high CPU/memory usage
4. Review recent deployments

#### Resolution

1. Enable query caching
2. Add missing database indexes
3. Scale horizontally (add instances)
4. Optimize slow queries

### High Database Load

```bash
# Check active connections
sqlite3 packages/db/sqlite.db "SELECT COUNT(*) FROM pragma_database_list();"

# Check slow queries
# Enable slow query log in SQLite
```

#### Resolution

1. Kill long-running queries
2. Add read replicas (if using libsql cloud)
3. Optimize queries
4. Add connection pooling

### Frontend Performance Issues

#### Diagnosis

1. Check Core Web Vitals in Vercel
2. Review bundle size
3. Check for large assets
4. Review network waterfall

#### Resolution

1. Enable code splitting
2. Lazy load components
3. Optimize images
4. Enable CDN caching

---

## Security Incidents

### Suspected Breach Response

```
1. Contain → 2. Investigate → 3. Eradicate → 4. Recover → 5. Learn
```

#### Immediate Actions

- [ ] Revoke all sessions
- [ ] Rotate all secrets
- [ ] Enable enhanced logging
- [ ] Notify security team
- [ ] Document timeline

### Rotate Secrets

```bash
# Generate new secret
openssl rand -base64 32

# Update in environment
# Vercel: Dashboard → Settings → Environment Variables
# Server: Update .env and restart

# Restart all services to pick up new secret
pm2 restart all
```

### Mass Session Revocation

```bash
# Revoke all sessions (emergency!)
sqlite3 packages/db/sqlite.db "DELETE FROM session;"

# All users will need to log in again
```

### Rate Limit Attack

```bash
# Increase rate limiting
# Update environment variables:
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_MS=60000

# Restart API server
pm2 restart pi-cast-api

# Consider IP blocking at firewall level
```

---

## Backup & Recovery

### Daily Backup Procedure

```bash
#!/bin/bash
# daily-backup.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="./backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp packages/db/sqlite.db $BACKUP_DIR/sqlite.db.$DATE

# Verify backup
sqlite3 $BACKUP_DIR/sqlite.db.$DATE "PRAGMA integrity_check;"

# Upload to cloud storage (example: AWS S3)
# aws s3 cp $BACKUP_DIR/sqlite.db.$DATE s3://pi-cast-backups/

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.db.*" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### Weekly Backup Verification

```bash
#!/bin/bash
# verify-backup.sh

LATEST_BACKUP=$(ls -t ./backups/sqlite.db.* | head -1)

# Restore to temp location
cp $LATEST_BACKUP /tmp/verify.db

# Run integrity check
sqlite3 /tmp/verify.db "PRAGMA integrity_check;"

# Verify row counts
sqlite3 /tmp/verify.db "SELECT 'user', COUNT(*) FROM user UNION ALL SELECT 'lesson', COUNT(*) FROM lesson;"

# Clean up
rm /tmp/verify.db

echo "Backup verification completed"
```

### Disaster Recovery

#### Full System Restore

1. **Provision Infrastructure**
   - Create new server/container
   - Install dependencies
   - Configure environment

2. **Restore Database**
   ```bash
   # Download latest backup
   aws s3 cp s3://pi-cast-backups/sqlite.db.latest ./sqlite.db
   
   # Verify integrity
   sqlite3 sqlite.db "PRAGMA integrity_check;"
   ```

3. **Deploy Application**
   ```bash
   bun install --frozen-lockfile
   bun run build
   pm2 start ecosystem.config.js
   ```

4. **Verify**
   - Health check endpoints
   - Authentication flow
   - Core features

---

## Communication Templates

### Incident Update Template

```
**Incident Update**

Status: [Investigating/Identified/Monitoring/Resolved]
Impact: [Description of user impact]
Timeline:
- HH:MM - Incident detected
- HH:MM - Team notified
- HH:MM - [Update]

Next update in: 30 minutes
```

### Resolution Template

```
**Incident Resolved**

Summary: [Brief description]
Root Cause: [What caused the issue]
Resolution: [How it was fixed]
Prevention: [Steps to prevent recurrence]

Post-mortem scheduled: [Date/Time]
```

---

## Contact Information

### On-Call Schedule

- Primary: [Name] - [Contact]
- Secondary: [Name] - [Contact]
- Escalation: [Name] - [Contact]

### Emergency Contacts

- Security: security@pi-cast.com
- Infrastructure: infra@pi-cast.com
- Management: [Contact]

### External Services

- Vercel Support: [Link]
- Database Provider: [Contact]
- Domain Registrar: [Contact]

---

*Last Updated: March 2026*
*Version: 1.0.0*
