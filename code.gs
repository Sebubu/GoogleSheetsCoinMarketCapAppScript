const COINMARKETCAP_API_KEY = "YOUR API KEY";
const CACHE_TIME_IN_MINUTES = 15;

function ccprice(name) {
  name = name.toLowerCase();
  const cache = new CCPriceCache();
  const cachedValue = cache.getValue(name);
  if (cachedValue) {
    console.log('get value from cache');
    return cachedValue;
  }

  const fetcher = new PriceFetcher(COINMARKETCAP_API_KEY, cache);
  fetcher.downloadToCache();

  const price = cache.getValue(name);
  if (price) {
    return parseFloat(price);
  }

  return name + ' not found';
}

class CCPriceCache {
  constructor() {
    this._cache = CacheService.getScriptCache();
  }

  _generateCacheKey(currency) {
    return 'ccprice_' + currency.toLowerCase();
  }

  getValue(currency){
    const key = this._generateCacheKey(currency);
    return this._cache.get(key);
  }

  setCurrencyValue(currency, value) {
    const key = this._generateCacheKey(currency);
    this._cache.put(key, value, 60*this.CACHE_TIME_IN_MINUTES);
  }
  setCurrencyValues(currencyValueDict) {
    const keyValueDict = {};
    for (const symb of Object.keys(currencyValueDict)) {
      const key = this._generateCacheKey(symb);
      keyValueDict[key] = currencyValueDict[symb];
    }
    console.log(keyValueDict);
    this._cache.putAll(keyValueDict, 60*this.CACHE_TIME_IN_MINUTES);
  }
  setLastUpdatedAt() {
    const key = this._generateCacheKey('lastUpdatedAt');
    this._cache.put(key, new Date());
  }
  get lastUpdatedAt() {
    const key = this._generateCacheKey('lastUpdatedAt');
    this._cache.get(key);
  }
}

class PriceFetcher {
  constructor(coinmarketcapApiKey, cache) {
    this.coinmarketcapApiKey = coinmarketcapApiKey;
    this.cache = cache;
    this.lock = LockService.getScriptLock();
  }

  _aquireLock() {
    this.lock.tryLock(3000);
    const hasLock = this.lock.hasLock();
    console.log('hasLock', hasLock)
    if (!hasLock) {
      console.error('Timeout aquiring lock.');
      return false;
    }
    return true;
  }

  _shouldDownloadPrices() {
    const startLockTime = new Date();
    const locked = this._aquireLock();
    const lastUpdatedAt = this.cache.lastUpdatedAt;

    if (locked && lastUpdatedAt) {
      const updatedAfterStartLock = startLockTime.getTime() < lastUpdatedAt.getTime();
      if (updatedAfterStartLock) {
        // Other process did the update
        console.log('other did the thing')
        return false;
      }
    }
    return true;
  }

  _savePricesToCache() {
    var url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?CMC_PRO_API_KEY=" + this.coinmarketcapApiKey;

    var response = UrlFetchApp.fetch(url);
    var json = response.getContentText();
    var data = JSON.parse(json);

    const keyValues = {};
    for (const currency of data['data']) {
      const symb = currency['symbol'];
      const priceUSD = currency['quote']['USD']['price'];
      keyValues[symb] = priceUSD.toString();
    }
    this.cache.setCurrencyValues(keyValues);
    this.cache.setLastUpdatedAt();
    this.lock.releaseLock();
  }

  downloadToCache() {
    if (!this._shouldDownloadPrices()) {
      return;
    }
    this._savePricesToCache();
  }
}

