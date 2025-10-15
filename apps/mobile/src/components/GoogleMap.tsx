import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface GoogleMapMarker {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  color?: string; // hex color
}

interface GoogleMapProps {
  apiKey: string;
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: GoogleMapMarker[];
  style?: any;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ apiKey, latitude, longitude, zoom = 12, markers = [], style }) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width, height=device-height" />
        <style>
          html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
          .gm-style-cc { display: none; } /* keep UI clean similar to mobile */
        </style>
        <script src="https://maps.googleapis.com/maps/api/js?key=${apiKey}"></script>
      </head>
      <body>
        <div id="map"></div>
        <script>
          function init() {
            var map = new google.maps.Map(document.getElementById('map'), {
              center: { lat: ${latitude}, lng: ${longitude} },
              zoom: ${zoom},
              mapTypeControl: false,
              fullscreenControl: false,
              streetViewControl: false
            });

            var markers = ${JSON.stringify(markers || [])};

            function createPin(color) {
              var pin = {
                path: 'M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z',
                fillColor: color || '#3B82F6',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 1
              };
              return pin;
            }

            markers.forEach(function(m) {
              var marker = new google.maps.Marker({
                position: { lat: m.latitude, lng: m.longitude },
                map: map,
                icon: createPin(m.color)
              });
              if (m.title || m.description) {
                var info = new google.maps.InfoWindow({ content: '<div style="font-family: Arial; font-size: 14px; font-weight: 600; color: #111827;">' + (m.title || 'Location') + (m.description ? '<br/><span style="font-weight: 400; color: #6B7280;">' + m.description + '</span>' : '') + '</div>' });
                marker.addListener('click', function() { info.open(map, marker); });
              }
            });
          }

          window.onload = init;
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        style={styles.webview}
        originWhitelist={["*"]}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 }
});

export default GoogleMap;


