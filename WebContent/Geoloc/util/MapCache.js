/*
 * MapCache : extension future de GFactualGeocodeCache
 * Attention à l'ordre : l'api googlemaps doit être chargée avant de déclarer cette classe
 */
// MapCache is a custom cache that extends the standard GeocodeCache.
// We call apply(this) to invoke the parent's class constructor.
function MapCache() { GFactualGeocodeCache.apply(this); }

// Assigns an instance of the parent class as a prototype of the
// child class, to make sure that all methods defined on the parent
// class can be directly invoked on the child class.
MapCache.prototype = new GFactualGeocodeCache();

// Override the reset method to empty the cache
MapCache.prototype.reset = function() { GFactualGeocodeCache.prototype.reset.call(this); };
