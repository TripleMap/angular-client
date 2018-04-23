import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css'],
  host: {
    class: 'dark-theme'
  }
})
export class NotFound implements OnInit {

  constructor(public router: Router) { }

  ngOnInit() {
    const map = L.map('map-not-found', {
      center: [63, 95],
      zoomControl: false,
      zoom: 3
    });
    new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
  }
  back() {
    this.router.navigate(['tdmap']);
  }
}
