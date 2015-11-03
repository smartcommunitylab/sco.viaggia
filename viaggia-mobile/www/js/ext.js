TRIP_TYPE_EXTRACTOR = function(agencyId, routeId, tripId) {
  if (agencyId == '5' || agencyId == '6') {
    return tripId.replace(/\d+.*/g,'').toUpperCase();
  }
  return tripId;
}
