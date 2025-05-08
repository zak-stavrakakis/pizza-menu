import { Component, Input } from '@angular/core';
import { Item, ItemPrice, Price } from '../../models/item.model';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppSettings } from '../../app.settings';

@Component({
  selector: 'app-menu-item',
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-item.component.html',
  styleUrl: './menu-item.component.css',
})
export class MenuItemComponent {
  @Input() item: Item = { itemId: -1, name: '' };
  @Input() prices: ItemPrice[] = [];

  showUndo: boolean = false;
  orignalPrices: ItemPrice[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.orignalPrices = this.dataService.originalPrices.filter(
      (x) => x.itemId === this.item.itemId
    );
  }

  findPriceIndex(sizeId: number) {
    return this.prices.findIndex((x) => x.sizeId === sizeId);
  }

  onPriceChecked(checked: boolean, sizeId: number) {
    const priceIndex = this.findPriceIndex(sizeId);
    if (priceIndex < 0) {
      return;
    }
    this.prices[priceIndex].isSelected = checked;

    this.dataService.updateItem(this.item.itemId, this.prices);
  }

  onPriceChange(value: number, sizeId: number) {
    const priceIndex = this.findPriceIndex(sizeId);
    if (priceIndex < 0) {
      return;
    }
    this.prices[priceIndex].price = value < 0 ? 0 : value;

    if (
      this.prices[priceIndex].price === 0 &&
      AppSettings.shouldDisableSelectionWhenPriceZero
    ) {
      this.prices[priceIndex].isSelected = false;
    }

    this.showUndo = this.prices.some((x) => {
      const currentPrice = this.orignalPrices.find(
        (p) => p.sizeId === x.sizeId
      )?.price;

      return currentPrice && currentPrice !== x.price;
    });

    this.dataService.updateItem(this.item.itemId, this.prices);
  }

  onRevertItem() {
    this.dataService.updateItem(
      this.item.itemId,
      structuredClone(this.orignalPrices)
    );
    this.showUndo = false;
  }
}
