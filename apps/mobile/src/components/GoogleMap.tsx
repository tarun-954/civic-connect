import React, { forwardRef, useImperativeHandle, useRef } from 'react';
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
  onMarkerPress?: (index: number) => void;
}
export interface GoogleMapHandle {
  centerTo: (latitude: number, longitude: number, openIndex?: number) => void;
}

const GoogleMap = forwardRef<GoogleMapHandle, GoogleMapProps>(({ apiKey, latitude, longitude, zoom = 12, markers = [], style, onMarkerPress }, ref) => {
  const webRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    centerTo: (lat: number, lng: number, openIndex?: number) => {
      const js = `if (window.__centerTo) { window.__centerTo(${lat}, ${lng}, ${typeof openIndex === 'number' ? openIndex : -1}); } true;`;
      try { webRef.current?.injectJavaScript(js); } catch {}
    }
  }), []);

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
              mapTypeControl: true,
              fullscreenControl: true,
              streetViewControl: true
            });

            var markersData = ${JSON.stringify(markers || [])};
            var markersArr = [];

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

            (markersData || []).forEach(function(m, i) {
              var marker = new google.maps.Marker({
                position: { lat: m.latitude, lng: m.longitude },
                map: map,
                icon: createPin(m.color)
              });
              markersArr.push(marker);
              if (m.title || m.description) {
                var info = new google.maps.InfoWindow({ content: '<div style="font-family: Arial; font-size: 14px; font-weight: 600; color: #111827;">' + (m.title || 'Location') + (m.description ? '<br/><span style="font-weight: 400; color: #6B7280;">' + m.description + '</span>' : '') + '</div>' });
                marker.addListener('click', function() { 
                  info.open(map, marker); 
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker-press', index: i }));
                  }
                });
              }
            });

            window.__centerTo = function(lat, lng, openIndex) {
              try {
                map.panTo({ lat: lat, lng: lng });
                if (typeof openIndex === 'number' && openIndex >= 0 && markersArr[openIndex]) {
                  google.maps.event.trigger(markersArr[openIndex], 'click');
                }
              } catch (e) {}
            };
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
        ref={webRef}
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data || '{}');
            if (data && data.type === 'marker-press' && typeof data.index === 'number') {
              onMarkerPress && onMarkerPress(data.index);
            }
          } catch {}
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 }
});

export default GoogleMap;


