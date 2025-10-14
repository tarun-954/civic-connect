import React from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: Array<{
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
  }>;
  style?: any;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  latitude,
  longitude,
  zoom = 15,
  markers = [],
  style
}) => {
  const createMapHTML = () => {
    const markersHTML = markers.map((marker, index) => `
      // Custom red marker icon
      var customIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: #EF4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
      
      L.marker([${marker.latitude}, ${marker.longitude}], {icon: customIcon})
        .addTo(map)
        .bindPopup('<div style="font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; color: #1F2937;">${marker.title || 'Location'}${marker.description ? '<br><span style="font-weight: normal; color: #6B7280;">' + marker.description : ''}</span></div>');
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
              integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
              crossorigin=""/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
                crossorigin=""></script>
        <style>
            body { 
                margin: 0; 
                padding: 0; 
                font-family: 'Arial', sans-serif;
            }
            #map { 
                height: 100vh; 
                width: 100vw; 
                border-radius: 12px;
            }
            .leaflet-control-attribution {
                background: rgba(255, 255, 255, 0.8) !important;
                font-size: 10px !important;
                padding: 2px 5px !important;
                border-radius: 4px !important;
            }
            .leaflet-control-zoom {
                border: none !important;
                border-radius: 8px !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
            }
            .leaflet-control-zoom a {
                background: white !important;
                color: #374151 !important;
                border: none !important;
                border-radius: 6px !important;
                font-size: 18px !important;
                font-weight: bold !important;
                width: 36px !important;
                height: 36px !important;
                line-height: 36px !important;
                margin: 2px !important;
            }
            .leaflet-control-zoom a:hover {
                background: #F3F4F6 !important;
                color: #1F2937 !important;
            }
            .custom-marker {
                background: none !important;
                border: none !important;
            }
            .leaflet-popup-content-wrapper {
                border-radius: 8px !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            }
            .leaflet-popup-tip {
                box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            var map = L.map('map', {
                zoomControl: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                touchZoom: true,
                dragging: true,
                attributionControl: true
            }).setView([${latitude}, ${longitude}], ${zoom});
            
            // Use a better looking tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap',
                subdomains: ['a', 'b', 'c']
            }).addTo(map);
            
            ${markersHTML}
            
            // Add a styled accuracy circle if there are markers
            ${markers.length > 0 ? `
            L.circle([${markers[0].latitude}, ${markers[0].longitude}], {
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 0.1,
                weight: 2,
                opacity: 0.6,
                radius: 100
            }).addTo(map);
            ` : ''}
            
            // Disable zoom on double tap to prevent accidental zooming
            map.on('dblclick', function(e) {
                map.setView(e.latlng, map.getZoom() + 1);
            });
        </script>
    </body>
    </html>
    `;
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html: createMapHTML() }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
});

export default LeafletMap;
