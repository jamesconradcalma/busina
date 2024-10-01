import { Component, OnInit, ViewChild, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { GoogleMap } from '@angular/google-maps';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.scss'],
})
export class MapsComponent  implements OnInit, AfterViewInit {

  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;
  center: google.maps.LatLngLiteral = { lat: 46.8182, lng: 8.2275 }; // Default center
  zoom = 8;

  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    // Initialize map after the view has been fully initialized
    if (this.map?.googleMap) {
      this.map.googleMap.setCenter(this.center);
    }
  }


}
