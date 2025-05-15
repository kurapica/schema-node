/**
 * A simple data change notification system.
 */
export class DataChangeWatcher
{
    private watchers: Set<Function> = new Set()

    /**
     * Add a watcher to the list.
     * @param watcher The watcher function.
     */
    public addWatcher(watcher: Function): Function
    {
        this.watchers.add(watcher)
        return () => this.removeWatcher(watcher)
    }

    /**
     * Remove a watcher from the list.
     * @param watcher The watcher function.
     */
    public removeWatcher(watcher: Function): void
    {
        this.watchers.delete(watcher)
    }

    /**
     * Notify all watchers with the given arguments.
     * @param args The arguments to pass to the watchers.
     */
    public notify(...args: any[]): void
    {
        this.watchers.forEach(watcher => {
            try {
                watcher(...args)
            } catch (error) {
                console.error("Error in watcher:", error)
            }
        })
    }

    /**
     * Clear all watchers.
     */
    public dispose(): void
    {
        this.watchers.clear()
    }
}