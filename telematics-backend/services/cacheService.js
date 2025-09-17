class SimpleCache {
    constructor() {
        this.cache = new Map();
    }

    generateKey(userId, days, type = 'default') {
        return `${type}_${userId}_${days}`;
    }

    get(userId, days, type) {
        const key = this.generateKey(userId, days, type);
        const entry = this.cache.get(key);

        if (!entry) return null;

        // Check if expired (default 10 minutes)
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        console.log(`✅ Cache HIT for ${key}`);
        return entry.data;
    }

    set(userId, days, data, type, ttlMinutes = 10) {
        const key = this.generateKey(userId, days, type);
        const ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });

        console.log(`💾 Cached ${key} for ${ttlMinutes} minutes`);
    }

    clear() {
        this.cache.clear();
        console.log('🧹 Cache cleared');
    }

    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

module.exports = new SimpleCache(); // Export singleton
