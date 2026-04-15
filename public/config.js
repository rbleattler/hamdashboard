// CUT START
var disableSetup = false;
var topBarCenterText = "KC3ROB-WRUS730";

// Grid layout desired
var layout_cols = 4;
var layout_rows = 3;

// Menu items
var aURL = [
  [
    "f3de21",
    "SATS",
    "satellite.js",
    "1",
    "L"
  ],
  [
    "2196F3",
    "The Adventure",
    "https://www.Bleattler.com",
    "1.7",
    "L"
  ],
  [
    "2196F3",
    "CONTEST",
    "https://www.contestcalendar.com/fivewkcal.html",
    "1",
    "L"
  ],
  [
    "2196F3",
    "APRS",
    "https://aprs.fi/#!lat=39.83&lng=-75.4155",
    "1",
    "L"
  ],
  [
    "2196F3",
    "LIGHTNING",
    "https://map.blitzortung.org/#3.87/36.5/-89.41",
    "1",
    "R"
  ],
  [
    "2196F3",
    "DX MAPS",
    "https://www.dxmaps.com/spots/mapg.php?Lan=E",
    "1.2",
    "L"
  ],
  [
    "2196F3",
    "RADAR",
    "https://weather.gc.ca/?layers=alert,radar&center=43.39961001,-78.53212031&zoom=6&alertTableFilterProv=ON",
    "1",
    "R"
  ],
  [
    "2196F3",
    "TIME.IS",
    "https://time.is/",
    "1",
    "R"
  ],
  [
    "2196F3",
    "WEATHER",
    "https://openweathermap.org/weathermap?basemap=map&cities=true&layer=temperature&lat=44.0157&lon=-79.4591&zoom=5",
    "1",
    "R"
  ],
  [
    "2196F3",
    "WINDS",
    "https://earth.nullschool.net/#current/wind/surface/level/orthographic=-78.79,44.09,3000",
    "1",
    "R"
  ]
];

// Feed items
var aRSS = [
  [
    "https://www.amsat.org/feed/",
    60
  ],
  [
    "https://daily.hamweekly.com/atom.xml",
    120
  ]
];

// Dashboard Tiles items
var aIMG = [
  [
    "RADAR",
    "https://radar.weather.gov/ridge/standard/CONUS_loop.gif",
    "https://radar.weather.gov/ridge/standard/KDIX_loop.gif"
  ],
  [
    "FORCAST",
    "https://www.wpc.ncep.noaa.gov/noaa/noaa.gif",
    "https://www.cpc.ncep.noaa.gov/products/stratosphere/uv_index/uvi_map.gif",
    "iframe|https://earth.nullschool.net/#current/wind/surface/level/orthographic=-75.05,39.77,17847",
    "invert|https://s.w-x.co/staticmaps/wu/wxtype/county_loc/bgm/animate.png",
    "weather|KPAUPPER32|b4a92c2b28844558a92c2b28841558e0|e"
  ],
  [
    "SATELLITE CONUS",
    "https://cdn.star.nesdis.noaa.gov/GOES16/ABI/CONUS/GEOCOLOR/GOES16-CONUS-GEOCOLOR-625x375.gif"
  ],
  [
    "SATELLITE LOCAL",
    "https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/ne/GEOCOLOR/GOES16-NE-GEOCOLOR-600x600.gif"
  ],
  [
    "LIGHTNING",
    "https://images.lightningmaps.org/blitzortung/america/index.php?animation=usa",
    "https://www.blitzortung.org/en/Images/image_b_ny.png"
  ],
  [
    "WEATHER ALERTS LOCAL",
    "https://www.weather.gov/images/phi/ghwo/LightningDay1.jpg",
    "https://www.weather.gov/images/phi/ghwo/ThunderstormWindDay1.jpg",
    "https://www.weather.gov/images/phi/ghwo/SevereThunderstormsDay1.jpg",
    "https://www.weather.gov/images/phi/ghwo/WindDay1.jpg"
  ],
  [
    "AIR TRAFFIC",
    "iframe|https://globe.adsbexchange.com/?airport=PHL",
    "iframe|https://globe.adsbexchange.com/?airport=EWR"
  ],
  [
    "TRAFFIC CAMS I-95 SEPA",
    "https://511pa.com/map/Cctv/3209--10?t=1719108080",
    "https://511pa.com/map/Cctv/3208--10?t=1719108270",
    "https://511pa.com/map/Cctv/2642--10?t=1719108330",
    "https://511pa.com/map/Cctv/2823--10?t=1719108390",
    "https://511pa.com/map/Cctv/3567--10?t=1719108440",
    "https://511pa.com/map/Cctv/2848--10?t=1719108490",
    "https://www.511pa.com/map/Cctv/2846--10?t=1730241450"
  ],
  [
    "BOREALIS",
    "https://services.swpc.noaa.gov/images/aurora-forecast-northern-hemisphere.jpg",
    "https://services.swpc.noaa.gov/images/swx-overview-large.gif",
    "https://services.swpc.noaa.gov/images/geospace/geospace_7_day.png",
    "https://services.swpc.noaa.gov/images/notifications-in-effect-timeline.png"
  ],
  [
    "GREY LINE",
    "https://www.timeanddate.com/scripts/sunmap.php?iso=now"
  ],
  [
    "ISS, HUBBLE & ACS3",
    "https://www.heavens-above.com/orbitdisplay.aspx?icon=default&width=600&height=300&mode=M&satid=59588",
    "https://www.heavens-above.com/orbitdisplay.aspx?icon=default&width=600&height=300&mode=M&satid=20580",
    "https://www.heavens-above.com/orbitdisplay.aspx?icon=default&width=600&height=300&mode=M&satid=44909",
    "https://www.heavens-above.com/orbitdisplay.aspx?icon=iss&width=600&height=300&mode=M&satid=25544"
  ],
  [
    "PROPAGATION",
    "https://www.tvcomm.co.uk/g7izu/Autosave/NA_ES_AutoSave.JPG",
    "https://services.swpc.noaa.gov/images/d-rap/global.png",
    "https://www.tvcomm.co.uk/g7izu/Autosave/HF_ZERO1_AutoSave.JPG",
    "https://www.tvcomm.co.uk/g7izu/Autosave/ATL_HF10_AutoSave.JPG",
    "https://www.hamqsl.com/solar101vhf.php",
    "https://www.hamqsl.com/solar100sc.php",
    "https://www.hamqsl.com/solarpich.php"
  ]
];

// Image rotation intervals in milliseconds per tile
var tileDelay = [
  11200,
  10000,
  11000,
  10100,
  10200,
  10500,
  10300,
  10600,
  30400,
  60700,
  300000,
  10800
];

// CUT END
