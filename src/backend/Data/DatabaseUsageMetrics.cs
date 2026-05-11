namespace GeoExplorer.Backend.Data;

public sealed class DatabaseUsageMetrics
{
    private readonly object _syncRoot = new();
    private readonly Dictionary<string, DatabaseUsageCounter> _operations = new(StringComparer.OrdinalIgnoreCase);

    public void RecordRead(string operation, int count = 1)
    {
        Record(operation, reads: count, writes: 0);
    }

    public void RecordWrite(string operation, int count = 1)
    {
        Record(operation, reads: 0, writes: count);
    }

    public DatabaseUsageSnapshot GetSnapshot()
    {
        lock (_syncRoot)
        {
            var operations = _operations
                .Select(item => new DatabaseUsageOperationSnapshot(
                    item.Key,
                    item.Value.Reads,
                    item.Value.Writes,
                    item.Value.Reads + item.Value.Writes))
                .OrderBy(operation => operation.Name)
                .ToList();

            return new DatabaseUsageSnapshot(
                operations.Sum(operation => operation.Reads),
                operations.Sum(operation => operation.Writes),
                operations.Sum(operation => operation.Total),
                operations);
        }
    }

    private void Record(string operation, int reads, int writes)
    {
        lock (_syncRoot)
        {
            if (!_operations.TryGetValue(operation, out var counter))
            {
                counter = new DatabaseUsageCounter();
                _operations[operation] = counter;
            }

            counter.Reads += reads;
            counter.Writes += writes;
        }
    }

    private sealed class DatabaseUsageCounter
    {
        public int Reads { get; set; }
        public int Writes { get; set; }
    }
}

public sealed record DatabaseUsageSnapshot(
    int TotalReads,
    int TotalWrites,
    int TotalOperations,
    IReadOnlyList<DatabaseUsageOperationSnapshot> Operations);

public sealed record DatabaseUsageOperationSnapshot(
    string Name,
    int Reads,
    int Writes,
    int Total);
