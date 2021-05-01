# Google sheets function for crypto currencies

Fetches crypto currency prices from CoinMarketCap.com and saves it in the Google cache to reduce api call. Prices in USD.


### Add to your sheet

1. Add the code to your App Script (Tools -> Script Editor).
2. Get an API KEY from https://coinmarketcap.com/api/.
3. Add your key to the script variable COINMARKETCAP_API_KEY in your sheet.


### Usage

Get a cryptocurreny price in USD. Use the following formula.

```
=ccprice("BTC")
```



