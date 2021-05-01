# Google sheets function for crypto currencies

Fetches crypto currency prices from coinmarketcap.com. 4911 currencies available. Prices in USD. Compared to [GOOGLEFINANCE](https://support.google.com/docs/answer/3093281?hl=en), CCPRICE provides prices for a wider range of crypto currencies.


### Add to your sheet
1. Get an API KEY from https://coinmarketcap.com/api/.
2. Add the code to your App Script (Tools -> Script Editor).
3. Add your key to the script variable COINMARKETCAP_API_KEY in your sheet.


### Usage

Get a cryptocurreny price in USD. Use the following formula.

```
=CCPRICE("BTC")
```

### Optimizations

The script is optimized to reduce API calls. 

- All prices are cached for 15min. Change the cache time with the variable `CACHE_TIME_IN_MINUTES` in code.gs.
- Multi call lock. When the script is called several times in parallel only 1 API call is made.
