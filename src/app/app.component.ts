import {Component, Input, OnInit, Renderer2, ViewChild} from '@angular/core';
import {StlLoaderComponent} from './stl-loader/stl-loader.component';

@Component({
  selector: 'app-root',
  imports: [StlLoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'stl-loader';
}

