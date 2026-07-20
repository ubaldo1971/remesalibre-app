/**
 * Exchange Rate Service
 * 
 * Fetches real-time exchange rates from free APIs.
 * Primary: Budjet API (no API key required)
 * Fallback: ExchangeRate-API open access
 */
class ExchangeRateService {
    constructor() {
        // Cached rate
        this.cachedRate = null;
        this.cacheExpiry = null;
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes

        // API endpoints (no API key required)
        this.primaryAPI = 'https://api.budjet.org/fiat/USD/MXN';
        this.fallbackAPI = 'https://open.er-api.com/v6/latest/USD';
    }

    /**
     * Get current USD/MXN exchange rate
     * @returns {Promise<number>} Exchange rate
     */
    async getUSDMXN() {
        // Check cache first
        if (this.cachedRate && this.cacheExpiry && Date.now() < this.cacheExpiry) {
            console.log('[ExchangeRate] Using cached rate:', this.cachedRate);
            return this.cachedRate;
        }

        try {
            // Try primary API first
            const rate = await this._fetchFromPrimary();
            if (rate) {
                this._updateCache(rate);
                return rate;
            }
        } catch (error) {
            console.error('[ExchangeRate] Primary API failed:', error.message);
        }

        try {
            // Fallback API
            const rate = await this._fetchFromFallback();
            if (rate) {
                this._updateCache(rate);
                return rate;
            }
        } catch (error) {
            console.error('[ExchangeRate] Fallback API failed:', error.message);
        }

        // Return cached or default if all APIs fail
        if (this.cachedRate) {
            console.log('[ExchangeRate] Using stale cached rate:', this.cachedRate);
            return this.cachedRate;
        }

        console.log('[ExchangeRate] All APIs failed, using default 19.50');
        return 19.50; // Default fallback
    }

    /**
     * Fetch from primary API (Budjet)
     * @private
     */
    async _fetchFromPrimary() {
        console.log('[ExchangeRate] Fetching from primary API...');

        const response = await fetch(this.primaryAPI, {
            headers: { 'Accept': 'application/json' },
            timeout: 5000
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const rate = data.rate || data.value || data.MXN;

        if (rate && typeof rate === 'number') {
            console.log('[ExchangeRate] Primary API rate:', rate);
            return rate;
        }

        throw new Error('Invalid response format');
    }

    /**
     * Fetch from fallback API (Open Exchange Rates API)
     * @private
     */
    async _fetchFromFallback() {
        console.log('[ExchangeRate] Fetching from fallback API...');

        const response = await fetch(this.fallbackAPI, {
            timeout: 5000
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (data.rates && data.rates.MXN) {
            console.log('[ExchangeRate] Fallback API rate:', data.rates.MXN);
            return data.rates.MXN;
        }

        throw new Error('Invalid response format');
    }

    /**
     * Update cache
     * @private
     */
    _updateCache(rate) {
        this.cachedRate = rate;
        this.cacheExpiry = Date.now() + this.cacheDuration;
        console.log('[ExchangeRate] Cache updated, expires in 5 min');
    }

    /**
     * Force refresh rate (bypass cache)
     */
    async forceRefresh() {
        this.cachedRate = null;
        this.cacheExpiry = null;
        return this.getUSDMXN();
    }

    /**
     * Get cache status
     */
    getCacheStatus() {
        return {
            hasCache: this.cachedRate !== null,
            rate: this.cachedRate,
            expiresIn: this.cacheExpiry ? Math.max(0, this.cacheExpiry - Date.now()) : 0
        };
    }
}

export const exchangeRateService = new ExchangeRateService();
