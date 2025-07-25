export interface Location {
  latLng: {
    latitude: number;
    longitude: number;
  };
}

export interface Waypoint {
  location: Location;
}

export interface TransitDetails {
  stopDetails: {
    arrivalStop: {
      name: string;
      location: Location;
    };
    departureStop: {
      name: string;
      location: Location;
    };
  };
  localizedValues: {
    arrivalTime: {
      time: {
        text: string;
      };
    };
    departureTime: {
      time: {
        text: string;
      };
    };
  };
  transitLine: {
    agencies: Array<{
      name: string;
    }>;
    name: string;
    color: string;
    vehicle: {
      name: {
        text: string;
      };
      type: string;
    };
  };
}

export interface RouteLeg {
  distanceMeters: number;
  duration: string;
  staticDuration: string;
  polyline: {
    encodedPolyline: string;
  };
  startLocation: Location;
  endLocation: Location;
  steps: Array<{
    distanceMeters: number;
    staticDuration: string;
    polyline: {
      encodedPolyline: string;
    };
    startLocation: Location;
    endLocation: Location;
    transitDetails?: TransitDetails;
    travelMode: string;
  }>;
}

export interface Route {
  legs: RouteLeg[];
  distanceMeters: number;
  duration: string;
  staticDuration: string;
  polyline: {
    encodedPolyline: string;
  };
  description: string;
  localizedValues: {
    distance: {
      text: string;
    };
    duration: {
      text: string;
    };
    staticDuration: {
      text: string;
    };
  };
}

export interface RoutesApiResponse {
  routes: Route[];
}

export interface RouteSearchParams {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  departureTime?: Date;
  arrivalTime?: Date;
  transitModes?: string[];
  transitRoutePreference?: 'TRANSIT_ROUTE_PREFERENCE_UNSPECIFIED' | 'LESS_WALKING' | 'FEWER_TRANSFERS';
}

export interface RouteSearchState {
  routes: Route[];
  loading: boolean;
  error: string | null;
}