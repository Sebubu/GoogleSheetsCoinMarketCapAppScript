# Google sheets function for crypto currencies

Fetches crypto currency prices from coinmarketcap.com. Prices in USD. 4911 currencies available.


### Add to your sheet

1. Add the code to your App Script (Tools -> Script Editor).
2. Get an API KEY from https://coinmarketcap.com/api/.
3. Add your key to the script variable COINMARKETCAP_API_KEY in your sheet.


### Usage

Get a cryptocurreny price in USD. Use the following formula.

```
=ccprice("BTC")
```

### Optimizations

The script is optimized to reduce API calls. 

- All prices are cached for 15min. Change the cache time with the variable `CACHE_TIME_IN_MINUTES` in code.gs.
- Multi call lock. When the script is called several times in parallel only 1 API call is made.
