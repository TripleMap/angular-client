import { Component, OnInit } from '@angular/core';
import L from '../../../node_modules/leaflet/dist/leaflet.js';

@Component({
  selector: 'tdmap',
  templateUrl: './tdmap.component.html',
  styleUrls: ['./tdmap.component.css']
})
export class TdmapComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  	console.log(L);
  	let map = L.map('map',{
  		editable:true,
  		center:[60,30],
  		zoom:16
  	});

  	let openStreetMap = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);


  }
}
