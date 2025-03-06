using System.Diagnostics;

public class Profiler {
    public static async Task Run(string name, Func<Task> action) {
        Console.Write(name);
        var stopwatch = new Stopwatch();
        stopwatch.Start();
        await action();
        stopwatch.Stop();
        Console.WriteLine(" (" + stopwatch.ElapsedMilliseconds + "ms)");
    }
}
