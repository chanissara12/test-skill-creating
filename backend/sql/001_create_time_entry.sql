-- 001_create_time_entry.sql  (PostgreSQL)
--
-- FOR REVIEW. The agent has NOT run this script. The database owner creates the databases
-- and runs it, once on the application database and once on the separate test database.
--
-- A Time Entry is one piece of work. A Running Timer is a Time Entry whose stopped_at_utc
-- is NULL. There is deliberately no constraint limiting the table to one running row
-- (decided against, see the spec); the backend enforces "one at a time".

CREATE TABLE time_entry (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title          varchar(200) NOT NULL,
    started_at_utc timestamptz  NOT NULL,
    stopped_at_utc timestamptz  NULL,

    CONSTRAINT ck_time_entry_title_not_blank
        CHECK (length(btrim(title)) > 0),
    CONSTRAINT ck_time_entry_stop_not_before_start
        CHECK (stopped_at_utc IS NULL OR stopped_at_utc >= started_at_utc)
);
