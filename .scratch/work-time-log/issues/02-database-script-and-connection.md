# 02: Database script and connection

**What to build:** The Time Entry table exists in a PostgreSQL database that the **user** created, and the backend can read and write it. This is database-first: the agent never creates the database and never runs the script; the code is written against the existing schema.

The agent's part: draft one SQL script, for the user to review, that creates the Time Entry table with an identifier, a required title of at most 200 characters, a required start instant and a nullable stop instant, both `timestamptz` in UTC, using snake_case names, with a rule that a stop is never before its start. There is deliberately **no** constraint limiting the table to one Running Timer (decided against, see the spec). Then map the backend's data access (Domain context and entity) onto that existing table and read the connection string from configuration, with a placeholder-only template committed. No migrations are generated or applied.

The user's part: review the script, create the application database and a **separate test database**, run the script on both, and put the real connection strings in local, uncommitted configuration.

**Blocked by:** 01 (Project skeleton).

**Status:** ready-for-human

- [ ] The script is delivered for review and has not been executed by the agent
- [ ] User confirms the application database and the test database exist with the table created
- [ ] The backend connects using configuration only; real connection strings are not committed
- [ ] A smoke check (through the backend's public behaviour, not by editing schema) can write and read one Time Entry against the test database
- [ ] The backend instructions' Tech Stack and database rules still match what was built (Npgsql provider, timestamptz, snake_case)
