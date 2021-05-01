const COINMARKETCAP_API_KEY = "YOUR API KEY";
const CACHE_TIME_IN_MINUTES = 15;

function ccprice(name) {
  const cache = new CCPriceCache();
  const cachedValue = cache.getValue(name);
  if (cachedValue) {
    console.log('get value from cache');
    return parseFloat(cachedValue);
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

  getValue(currency){
    const data = this._readDict();
    return data[currency.toUpperCase()];
  }

  _readDict() {
    let partIndex = 0;
    let stopReading = false;
    let readValues = {};
    while (!stopReading) {
      const key = this._partKey(partIndex);
      const read = this._cache.get(key);
      if (!read) {
        break;
      }
      const data = JSON.parse(read);
      readValues = Object.assign(readValues, data);
      partIndex += 1;
    }
    return readValues;
  }

  setCurrencyValues(currencyValueDict) {
    this._saveToCache(currencyValueDict, 200);
  }

  _partKey(index) {
    return 'part_' + index;
  }

  _saveToCache(keyValues, maxLength) {
    let dict = {};
    let count = 0;
    let partIndex = 0;
    for (const symb of Object.keys(keyValues)) {
      count += 1;
      dict[symb] = keyValues[symb];

      if (count === maxLength) {
        const key = this._partKey(partIndex)
        const data = JSON.stringify(dict)
        this._cache.put(key, data, 60*CACHE_TIME_IN_MINUTES)
        dict = {};
        count = 0;
        partIndex += 1;
      }
    }
  }


  setLastUpdatedAt() {
    const key = 'cc_lastUpdatedAt';
    this._cache.put(key, new Date());
  }
  get lastUpdatedAt() {
    const key = 'cc_lastUpdatedAt';
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
    var url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=5000&CMC_PRO_API_KEY=" + this.coinmarketcapApiKey;

    var response = UrlFetchApp.fetch(url);
    var json = response.getContentText();
    var data = JSON.parse(json);
    console.log('fetched', data['data'].length, 'currencies');
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

