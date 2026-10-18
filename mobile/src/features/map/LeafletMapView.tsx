import React, { useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../theme';
import { Issue } from '../complaints/types';

interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  category: string;
  status: string;
}

interface LeafletMapViewProps {
  initialLatitude?: number;
  initialLongitude?: number;
  zoom?: number;
  markers?: (Issue | MapMarker)[];
  selectable?: boolean;
  selectedLatitude?: number | null;
  selectedLongitude?: number | null;
  onLocationSelect?: (location: { latitude: number; longitude: number }) => void;
  onMarkerPress?: (id: string) => void;
  showCluster?: boolean;
  showLegend?: boolean;
  showRecenterButton?: boolean;
  userLatitude?: number;
  userLongitude?: number;
  selectedMarkerId?: string | null;
  height?: number | string;
}

const CATEGORY_COLORS: Record<string, string> = {
  road_damage: '#dc2626',
  garbage: '#84cc16',
  streetlight: '#eab308',
  water: '#0ea5e9',
  drainage: '#8b5cf6',
};

export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  initialLatitude = 22.7196,
  initialLongitude = 75.8577,
  zoom = 13,
  markers = [],
  selectable = false,
  selectedLatitude,
  selectedLongitude,
  onLocationSelect,
  onMarkerPress,
  showCluster = false,
  showLegend = false,
  showRecenterButton = false,
  userLatitude,
  userLongitude,
  height = 250,
}) => {
  const { colors } = useTheme();
  const webViewRef = useRef<WebView>(null);

  const normalizedMarkers: MapMarker[] = markers.map((m) => {
    if ('location' in m && m.location?.coordinates) {
      return {
        id: m._id,
        latitude: m.location.coordinates[1],
        longitude: m.location.coordinates[0],
        title: m.trackingId || m.description,
        category: m.category,
        status: m.status,
      };
    }
    return m as MapMarker;
  });

  const selectedPin =
    selectedLatitude && selectedLongitude
      ? { lat: selectedLatitude, lng: selectedLongitude }
      : null;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  ${
    showCluster
      ? `<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.1/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.1/dist/MarkerCluster.Default.css" />`
      : ''
  }
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  ${
    showCluster
      ? `<script src="https://unpkg.com/leaflet.markercluster@1.5.1/dist/leaflet.markercluster.js"></script>`
      : ''
  }
  <style>
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      padding: 4px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.15);
    }
    .popup-title {
      font-weight: 700;
      font-size: 13px;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .popup-meta {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 6px;
    }
    .popup-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 999px;
      background: #dbeafe;
      color: #1d4ed8;
      margin-right: 4px;
    }
    .popup-btn {
      display: block;
      width: 100%;
      text-align: center;
      background: #2563eb;
      color: #ffffff;
      padding: 5px 8px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      margin-top: 4px;
    }
    .pulse-pin {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #2563eb;
      border: 3px solid #ffffff;
      box-shadow: 0 0 10px rgba(37,99,235,0.7);
    }
    .legend {
      background: white;
      padding: 12px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      font-size: 11px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      margin-bottom: 6px;
    }
    .legend-color {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      margin-right: 6px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .recenter-btn {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${selectedPin ? selectedPin.lat : initialLatitude}, ${selectedPin ? selectedPin.lng : initialLongitude}], ${zoom});

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var markersData = ${JSON.stringify(normalizedMarkers)};
    var selectable = ${selectable};
    var selectedMarker = null;
    var userLatitude = ${userLatitude || null};
    var userLongitude = ${userLongitude || null};

    var statusColors = {
      'Submitted': '#2563eb',
      'Under Review': '#7c3aed',
      'Assigned': '#d97706',
      'In Progress': '#0284c7',
      'Resolved': '#059669',
      'Rejected': '#dc2626'
    };

    var categoryColors = ${JSON.stringify(CATEGORY_COLORS)};

    function getCategoryColor(category) {
      return categoryColors[category] || '#6b7280';
    }

    function createIcon(color) {
      return L.divIcon({
        className: 'custom-icon',
        html: '<div style="background:' + color + ';width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
    }

    var markerGroup = ${showCluster ? 'L.markerClusterGroup()' : 'L.featureGroup()'};

    markersData.forEach(function(m) {
      var color = getCategoryColor(m.category);
      var marker = L.marker([m.latitude, m.longitude], { icon: createIcon(color) });

      var popupHtml = '<div class="popup-title">' + (m.title || 'Issue') + '</div>' +
        '<div class="popup-meta">' + (m.category || '') + '</div>' +
        '<div><span class="popup-badge">' + (m.status || '') + '</span></div>' +
        '<button class="popup-btn" onclick="sendMarkerClick(\\'' + m.id + '\\')">View Details</button>';

      marker.bindPopup(popupHtml);
      markerGroup.addLayer(marker);
    });

    map.addLayer(markerGroup);

    ${
      showLegend
        ? `
    var legend = L.control({ position: 'topleft' });
    legend.onAdd = function(map) {
      var div = L.DomUtil.create('div', 'legend');
      var categories = ['road_damage', 'garbage', 'streetlight', 'water', 'drainage'];
      var categoryLabels = {
        'road_damage': 'Road Damage',
        'garbage': 'Garbage',
        'streetlight': 'Streetlight',
        'water': 'Water',
        'drainage': 'Drainage'
      };

      categories.forEach(function(cat) {
        var item = L.DomUtil.create('div', 'legend-item', div);
        var color = L.DomUtil.create('div', 'legend-color', item);
        color.style.backgroundColor = categoryColors[cat];
        var label = L.DomUtil.create('span', null, item);
        label.textContent = categoryLabels[cat];
      });

      return div;
    };
    legend.addTo(map);
    `
        : ''
    }

    ${
      showRecenterButton && userLatitude
        ? `
    var recenterControl = L.control({ position: 'bottomleft' });
    recenterControl.onAdd = function(map) {
      var div = L.DomUtil.create('div', 'recenter-btn');
      div.innerHTML = '📍';
      div.style.fontSize = '18px';
      div.onclick = function() {
        map.setView([userLatitude, userLongitude], 15);
      };
      L.DomEvent.disableClickPropagation(div);
      return div;
    };
    recenterControl.addTo(map);
    `
        : ''
    }

    ${
      userLatitude
        ? `
    L.marker([userLatitude, userLongitude], {
      icon: L.divIcon({
        className: 'user-location',
        html: '<div class="pulse-pin"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    }).addTo(map);
    `
        : ''
    }

    ${
      selectedPin
        ? `
      selectedMarker = L.marker([${selectedPin.lat}, ${selectedPin.lng}], {
        icon: L.divIcon({
          className: 'pulse-container',
          html: '<div class="pulse-pin"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        }),
        draggable: selectable
      }).addTo(map);

      if (selectable) {
        selectedMarker.on('dragend', function(e) {
          var pos = e.target.getLatLng();
          sendLocationSelect(pos.lat, pos.lng);
        });
      }
    `
        : ''
    }

    if (selectable) {
      map.on('click', function(e) {
        var lat = e.latlng.lat;
        var lng = e.latlng.lng;

        if (selectedMarker) {
          selectedMarker.setLatLng([lat, lng]);
        } else {
          selectedMarker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'pulse-container',
              html: '<div class="pulse-pin"></div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            }),
            draggable: true
          }).addTo(map);

          selectedMarker.on('dragend', function(ev) {
            var pos = ev.target.getLatLng();
            sendLocationSelect(pos.lat, pos.lng);
          });
        }

        sendLocationSelect(lat, lng);
      });
    }

    function sendLocationSelect(lat, lng) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'LOCATION_SELECT',
          latitude: lat,
          longitude: lng
        }));
      }
    }

    function sendMarkerClick(id) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MARKER_PRESS',
          id: id
        }));
      }
    }
  </script>
</body>
</html>
  `;

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOCATION_SELECT' && onLocationSelect) {
        onLocationSelect({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      } else if (data.type === 'MARKER_PRESS' && onMarkerPress) {
        onMarkerPress(data.id);
      }
    } catch {}
  };

  return (
    <View
      style={[
        styles.container,
        { height: typeof height === 'number' ? height : '100%', borderColor: colors.border, backgroundColor: colors.surface },
      ]}
    >
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onMessage={handleMessage}
        renderLoading={() => (
          <View style={[styles.loading, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
        startInLoadingState
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

