import { Component, OnInit, OnDestroy } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner'

import { Router } from '@angular/router';

// import { BarcodeScanner } from '@capacitor-community/barcode-scanner'

// import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { AlertController, ToastController } from '@ionic/angular';

import { HaversineService } from './haversine.service';

// import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  // initialize muna natin yung mga variables
  latitude: number | null = null;
  longitude: number | null = null;

  endlatitude: number | null = null;
  endlongitude: number | null = null;

  distance: number | null = null;

  qrcodeResult: any | null = null;

  // for qr code scanning
  isSupported = false;
  // barcodes: Barcode[] = [];

  scannedValue: any | null = null;

  // for interval (getting location every 5 seconds)
  intervalId: any;
  // setting a flag (para sa pag-detect ongoing pa ba yung trip)
  tripOngoing: boolean = false;

  locations: { latitude:number, longitude:number }[] = [];
  maxLocations: number = 100;
  locationCounter: number = 0;

  constructor(
      private alertController: AlertController,
      private toastController: ToastController,
      private router: Router,
      private haversineService: HaversineService
    ) {
  }

  ngOnInit() {
    // BarcodeScanner.isSupported().then((result) => {
    //   console.log('Barcode scanning supported:', result.supported);
    // });
  }

  // for location
  // need muna icheck kung permitted na ba yung location access before executing the function
  // pero need muna natin icheck san ba nagrrun yung application (kung sa native or sa web)
  // magkakaroon kasi ng error kung sa web nagrrun tas ichecheck kung may permission ba na for native and vice versa
  async getCurrentLocation() {
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Geolocation for mobile platforms
      await this.requestPermission();
      const position = await Geolocation.getCurrentPosition();
      this.latitude = position.coords.latitude;
      this.longitude = position.coords.longitude;
    } else {
      // Use browser's native Geolocation API for the web
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.latitude = position.coords.latitude;
            this.longitude = position.coords.longitude;

          },
          (error) => {
            console.error('Error getting location', error);
          },
          {
            enableHighAccuracy: true,  // Request high accuracy
            timeout: 5000,              // Set a timeout for the request
            maximumAge: 0              // Don't use cached location
          }
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
      }
    }
    console.log(this.latitude, this.longitude);
  }

  async getEndLocation() {
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Geolocation for mobile platforms
      await this.requestPermission();
      const position = await Geolocation.getCurrentPosition();
      this.endlatitude = position.coords.latitude;
      this.endlongitude = position.coords.longitude;
    } else {
      // Use browser's native Geolocation API for the web
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.endlatitude = position.coords.latitude;
            this.endlongitude = position.coords.longitude;

            // get distance?\
            if (this.latitude !== null && this.longitude !== null && this.endlatitude !== null && this.endlongitude !== null) {
              this.distance = this.haversineService.haversineDistance(
                this.latitude, 
                this.longitude, 
                this.endlatitude, 
                this.endlongitude
              );

              this.showToast((this.distance).toString())
            }
          },
          (error) => {
            console.error('Error getting location', error);
          },
          {
            enableHighAccuracy: true,  // Request high accuracy
            timeout: 5000,              // Set a timeout for the request
            maximumAge: 0              // Don't use cached location
          }
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
      }
    }
    console.log(this.endlatitude, this.endlongitude);
  }

  // for qr code scanning (mahalaga ilagay 'yung mga options)
  async startScan(){
     try{
        const result = await CapacitorBarcodeScanner.scanBarcode({
          hint: 17,
          cameraDirection: 1,
          scanOrientation: 1
        });

        if(result){
          console.log(result.ScanResult);
          this.scannedValue = result;

          await this.showToast(result.ScanResult)
        }
     }catch(e){
        throw(e);
     }
  }

  // for getting the path test
  async getLocationForPath() {
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Geolocation for mobile platforms
      await this.requestPermission();
      const position = await Geolocation.getCurrentPosition();
      this.latitude = position.coords.latitude;
      this.longitude = position.coords.longitude;

      this.locations.push( { latitude: this.latitude, longitude: this.longitude } );
    } else {
      // Use browser's native Geolocation API for the web
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.latitude = position.coords.latitude;
            this.longitude = position.coords.longitude;
            
            this.locations.push( { latitude: this.latitude, longitude: this.longitude } );
            console.log(this.locations);
          },
          (error) => {
            console.error('Error getting location', error);
          },
          {
            enableHighAccuracy: true,  // Request high accuracy
            timeout: 5000,              // Set a timeout for the request
            maximumAge: 0              // Don't use cached location
          }
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
      }
    }
    console.log(this.latitude, this.longitude);
  }

  // starting a trip
  startTrip(): void{
    // check muna 'yung flag if ongoing ang trip or hindi
    if(!this.tripOngoing){
      // if di pa ongoing ang trip, get the location every 5 seconds
      this.intervalId = setInterval(() => {
        this.getLocationForPath();
      }, 5000);
      // update the flag to true
      this.tripOngoing = true;
    }
  }

  endTrip(): void{
    if(this.intervalId){
      clearInterval(this.intervalId);
      // set to false ulit 'yung flag to make it look like na ang trip ay tapos na or not ongoing
      this.tripOngoing = true;
    }
  }

  // creating a toast
  async showToast(message: string){
    const toast = await this.toastController.create({
      message: `Result: ${message}`,
      duration: 3000,
      position: 'bottom'
    });
    toast.present();
  }

  ngOnDestroy(): void {
    // stop location tracking if nag close ang app/component
    if(this.intervalId){
      clearInterval(this.intervalId);
    }
  }

  // routes
  goToMaps(){
    this.router.navigate(['/maps'])
  }

  // async startScanCommunity(){
  //   await BarcodeScanner
  // }

  // scan
  // async scan(): Promise<void> {
  //   const granted = await this.requestCameraPermissions();
  //   if (!granted) {
  //     this.presentAlert();
  //     return;
  //   }

  //   BarcodeScanner.startScan();

  //   const { barcodes } = await BarcodeScanner.scan();
  //   this.barcodes.push(...barcodes);
  // }

  // async startScan(){
  //   try{
  //     const result = await BarcodeScanner.scan();
  //     console.log(result)
  //   }catch(error){
  //     console.log(error)
  //   }
  // }

  // async scanBarcode() {
  //   const { camera } = await BarcodeScanner.requestPermissions();
  //   if (camera === 'granted' || camera === 'limited') {
  //     const { barcodes } = await BarcodeScanner.scan();
  //     if (barcodes.length > 0) {
  //       this.scannedValue = barcodes[0].displayValue;
  //     } else {
  //       this.scannedValue = 'No barcode detected';
  //     }
  //   } else {
  //     console.error('Camera permission denied');
  //   }
  // }


  // request permission on the device
  async requestPermission() {
    const status = await Geolocation.requestPermissions();
    console.log('Location permission status:', status);
  }

  // async requestCameraPermissions(): Promise<boolean> {
  //   const { camera } = await CapacitorBarcodeScanner.requestPermissions();
  //   return camera === 'granted' || camera === 'limited';
  // }

  async presentAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission denied',
      message: 'Please grant camera permission to use the barcode scanner.',
      buttons: ['OK'],
    });
    await alert.present();
  }
  
  // for qr code scanner
  // async startScan() {
  //   // Request permission to use the camera
  //   await CapacitorBarcodeScanner.checkPermission({ force: true });

  //   // Start scanning
  //   const result = await scanBarcode(options: CapacitorBarcodeScannerOptions) => Promise<CapacitorBarcodeScannerScanResult>

  //   console.log(result.ScanResult)
  // }

  // async requestCameraPermission() {
  //   const status = await BarcodeScanner.requestPermissions();
  //   console.log('Camera permission status:', status);
  // }




}
