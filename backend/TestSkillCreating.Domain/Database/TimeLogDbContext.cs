using Microsoft.EntityFrameworkCore;

namespace TestSkillCreating.Domain.Database;

// Database-first: the schema is owned by the SQL scripts in backend/sql. Never generate migrations from this model.
public class TimeLogDbContext(DbContextOptions<TimeLogDbContext> options) : DbContext(options)
{
    public DbSet<TimeEntry> TimeEntries => Set<TimeEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TimeEntry>(entity =>
        {
            entity.ToTable("time_entry");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.Title).HasColumnName("title").HasMaxLength(200).IsRequired();
            entity.Property(e => e.StartedAtUtc).HasColumnName("started_at_utc");
            entity.Property(e => e.StoppedAtUtc).HasColumnName("stopped_at_utc");
        });
    }
}
