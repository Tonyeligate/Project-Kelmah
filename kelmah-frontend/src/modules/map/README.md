# Professional Map Application - Uber-like Location Services

A comprehensive map application built for the Kelmah platform with advanced location services, similar to Uber's professional interface.

## 🚀 Features

### Core Map Functionality
- **Interactive Map**: Built with Leaflet and React-Leaflet for smooth interactions
- **Multiple Tile Layers**: OpenStreetMap, Satellite, and Dark mode support
- **Custom Markers**: Different markers for jobs, workers, and user location
- **Real-time Location**: GPS tracking with high accuracy positioning
- **Search Radius**: Visual circle overlay showing search area

### Location Services
- **Geocoding & Reverse Geocoding**: Address ↔ Coordinates conversion
- **Location Autocomplete**: Smart address suggestions with recent locations
- **Distance Calculations**: Haversine formula for accurate distance measurement
- **Location Caching**: Optimized performance with intelligent caching

### Search & Filtering
- **Advanced Filters**: Category, budget range, rating, experience level
- **Real-time Search**: Instant results as you type
- **Radius Search**: Adjustable search radius (1-50km)
- **Location-based Results**: Sorted by distance from user or selected location

### Professional UI/UX
- **Responsive Design**: Mobile-first approach with touch-friendly controls
- **Material Design**: Professional UI components with smooth animations
- **Floating Controls**: Zoom, layers, fullscreen, and location controls
- **Search Overlay**: Slide-out panel with filters and results
- **Loading States**: Professional loading indicators and error handling

## 🗂️ File Structure

```
src/modules/map/
├── components/
│   └── common/
│       ├── InteractiveMap.jsx         # Main map component
│       ├── LocationSelector.jsx       # Address input with autocomplete
│       └── MapSearchOverlay.jsx       # Search panel with filters
├── pages/
│   └── ProfessionalMapPage.jsx       # Main map page
├── services/
│   └── mapService.js                 # Location services & utilities
├── index.js                          # Module exports
└── README.md                         # This file
```

## 🛠️ Components

### InteractiveMap
The core map component with professional controls and interactions.

```jsx
import { InteractiveMap } from '../modules/map';

<InteractiveMap
  center={[37.7749, -122.4194]}
  zoom={12}
  markers={searchResults}
  onMarkerClick={handleMarkerClick}
  showUserLocation={true}
  showSearchRadius={true}
  searchRadius={10}
  height="100vh"
  controls={{
    location: true,
    zoom: true,
    layers: true,
    fullscreen: true
  }}
/>
```

### LocationSelector
Smart location input with autocomplete and recent locations.

```jsx
import { LocationSelector } from '../modules/map';

<LocationSelector
  value={location}
  onChange={setLocation}
  onLocationSelect={handleLocationSelect}
  placeholder="Enter location"
  showCurrentLocation={true}
  showRecentLocations={true}
/>
```

### MapSearchOverlay
Professional search interface with filters and results.

```jsx
import { MapSearchOverlay } from '../modules/map';

<MapSearchOverlay
  onSearch={handleSearch}
  onFilterChange={handleFilterChange}
  searchResults={results}
  searchType="jobs" // or "workers"
  userLocation={userLocation}
  isVisible={showSearch}
/>
```

## 🌐 Map Service

The `mapService` provides comprehensive location utilities:

```jsx
import { mapService } from '../modules/map';

// Get user location
const location = await mapService.getCurrentLocation();

// Convert address to coordinates
const results = await mapService.geocodeAddress("123 Main St, San Francisco");

// Convert coordinates to address
const address = await mapService.reverseGeocode(37.7749, -122.4194);

// Calculate distance between points
const distance = mapService.calculateDistance(lat1, lon1, lat2, lon2);

// Filter locations by radius
const nearby = mapService.filterLocationsByRadius(userLocation, locations, 5);
```

## 📱 Mobile Experience

### Responsive Design
- **Mobile Drawer**: Bottom slide-up search panel on mobile
- **Touch Controls**: Optimized for touch interactions
- **Floating Action Buttons**: Easy access to search and location
- **Adaptive Layout**: Automatically adjusts for screen size

### Performance
- **Lazy Loading**: Components load on demand
- **Debounced Search**: Optimized API calls
- **Location Caching**: Reduces redundant geocoding requests
- **Efficient Markers**: Clustering for large datasets

## 🎨 Professional UI Features

### Visual Design
- **Material Design**: Consistent with app theme
- **Smooth Animations**: Framer Motion integration
- **Professional Colors**: Primary/secondary color scheme
- **Loading States**: Skeleton screens and progress indicators

### User Experience
- **Intuitive Controls**: Familiar map interactions
- **Error Handling**: Graceful error messages
- **Accessibility**: Screen reader friendly
- **Keyboard Navigation**: Full keyboard support

## 🔧 Configuration

### Environment Setup
No additional environment variables needed. The map uses:
- **Nominatim API**: Free geocoding service (OpenStreetMap)
- **Browser Geolocation**: Built-in location services
- **Leaflet Maps**: Open source mapping library

### Customization
You can customize:
- **Tile Layers**: Add custom map styles
- **Marker Icons**: Custom marker designs
- **Search Filters**: Additional filter categories
- **UI Theme**: Colors and styling

## 🚀 Getting Started

1. **Navigate to Map**: Visit `/map` in your application
2. **Allow Location**: Grant location permissions for best experience
3. **Search**: Use the search overlay to find jobs or workers
4. **Filter**: Apply filters to refine results
5. **Interact**: Click markers to view details

## 🔮 Future Enhancements

Ready for these advanced features:
- **Real-time Tracking**: Live location updates
- **Route Planning**: Directions between locations
- **Clustering**: Marker clustering for performance
- **Offline Maps**: Cache tiles for offline use
- **Custom Areas**: Draw custom search areas
- **Heat Maps**: Density visualization

## 📝 Usage Examples

### Basic Job Search
```jsx
// Navigate to map page
navigate('/map');

// Search for jobs in specific area
const searchParams = {
  query: 'web developer',
  location: 'San Francisco, CA',
  radius: 10,
  type: 'jobs',
  filters: {
    categories: ['Development'],
    budget: [1000, 5000],
    rating: 4
  }
};
```

### Worker Discovery
```jsx
// Switch to worker search
setSearchType('workers');

// Find workers near user
const nearbyWorkers = mapService.filterLocationsByRadius(
  userLocation, 
  allWorkers, 
  25 // 25km radius
);
```

This professional map application provides a comprehensive location-based search experience that enhances user productivity and makes finding jobs and workers more intuitive and efficient. 