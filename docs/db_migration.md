Database Schema Change Workflow - Quick Reference
🚨 Golden Rules
Never run prisma migrate dev on production

Always backup production DB before migrations

Always test on staging first

Commit all migration files to Git

📋 Standard Workflow
1. Local Development
bash
# Make schema changes, then:
npx prisma migrate dev --name describe_your_change
npx prisma generate
# Test thoroughly locally
2. Staging Deployment
bash
# Backup staging DB
# Run migrations
npx prisma migrate deploy
# Test again
3. Production Deployment
bash
# On production server after pulling changes:
npx prisma migrate deploy
npx prisma generate
# Restart application
📋 Custom Migration (For Data Transformations)
When Needed
Renaming columns

Changing data types

Splitting/merging tables

Populating new fields with existing data

Steps
bash
# 1. Create empty migration
npx prisma migrate dev --create-only --name migration_name

# 2. Edit the generated SQL file with custom logic
#    (Use transactions: BEGIN; ... COMMIT;)

# 3. Test locally
npx prisma migrate dev

# 4. Commit the migration folder
Example: Split user_roles into user_roles + permissions
sql
-- UP migration
BEGIN;
CREATE TABLE "permissions" (...);
INSERT INTO "permissions" ...;
ALTER TABLE "user_roles" ADD COLUMN "permission_id" ...;
COMMIT;

-- DOWN migration (if needed)
BEGIN;
DROP TABLE "permissions";
ALTER TABLE "user_roles" DROP COLUMN "permission_id";
COMMIT;
📋 Rollback Options
Option 1: Mark as Rolled Back
bash
npx prisma migrate resolve --rolled-back <migration_name>
Option 2: Reset and Redevelop (Local Only)
bash
npx prisma migrate reset --force
npx prisma migrate dev --name describe_your_change
Option 3: Restore from Backup (Production)
bash
# Restore from backup file
psql -U username -h host production_db < backup_file.sql
📋 Database Backup Commands
PostgreSQL
bash
pg_dump -U username -h host production_db > backup_$(date +%Y%m%d).sql
MySQL
bash
mysqldump -u username -p production_db > backup_$(date +%Y%m%d).sql
MongoDB
bash
mongodump --uri="mongodb://host/production_db" --out=backup_$(date +%Y%m%d)
⚠️ Common Pitfalls
Pitfall	Prevention
Missing migration files in Git	Always commit prisma/migrations/
Running dev migrations on production	Use migrate deploy in production
Not testing on staging first	Always test on staging with production data copy
No rollback plan	Always have backup and DOWN migrations
Not backing up before migrations	Automate backups in deployment pipeline
Forgetting to generate Prisma client	Add prisma generate to deployment script
Long table locks	Use nullable-first pattern for NOT NULL columns
📝 Command Reference
Command	When to Use
prisma migrate dev	Local development only
prisma migrate dev --create-only	Create custom migration
prisma migrate deploy	Staging & production
prisma migrate resolve	Mark migration status
prisma generate	After every migration
prisma db push	Prototyping only (never production)
🎯 Quick Decision Tree
text
Need to change schema?
        │
        ├─→ Simple field add/remove?
        │       └─→ Use: prisma migrate dev --name xxx
        │
        └─→ Need data transformation?
                └─→ Use: prisma migrate dev --create-only
                     ↓
                Edit SQL manually
                     ↓
                Test → Commit → Deploy
Remember: Migration files = Source control = Safety net. Never bypass them on production!

