Export the Backup (Current Machine)
Run this command in your terminal. It uses the credentials from your docker-compose.yml:

docker exec -t hms-postgres pg_dump -U hms_user -d hms_db > hms_backup.sql


hms-postgres: The container_name from your file.
hms_user: The user defined in your environment.
hms_db: The database name.
hms_backup.sql: The file created on your actual computer (not inside the container).


2. Restore the Backup (New Machine)
Once you move to the new machine and run docker-compose up -d, follow these steps to import the data:
Copy the file hms_backup.sql to the new machine

Run the restore command:
cat hms_backup.sql | docker exec -i hms-postgres psql -U hms_user -d hms_db
