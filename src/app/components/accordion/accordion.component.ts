import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-accordion',
  imports: [CommonModule],
  templateUrl: './accordion.component.html',
  styleUrl: './accordion.component.css',
})
export class AccordionComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() expandMoreIcon: string = 'chevron.png';
  @Output() onToggle = new EventEmitter<any>();

  handleToggle() {
    this.onToggle.emit(!this.isOpen);
  }
}
