import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Item, ItemPrice, Size } from '../models/item.model';
import { FormsModule } from '@angular/forms';
import { DataService } from '../services/data.service';
import { concatMap, Subscription, take, tap } from 'rxjs';
import { AccordionComponent } from '../components/accordion/accordion.component';
import { MenuItemComponent } from '../components/menu-item/menu-item.component';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, AccordionComponent, MenuItemComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  items: Item[] = [];
  sizes: Size[] = [];
  prices: ItemPrice[] = [];
  selected: { [itemIndex: number]: { [sizeId: number]: boolean } } = {};
  priceInputs: { [itemIndex: number]: { [sizeId: number]: number } } = {};
  activeItemId: number | null = null;
  itemToPricesMap: Record<string, ItemPrice[]> = {};

  private setupSubscription: Subscription = new Subscription();

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.setupSubscription = this.dataService
      .getItems()
      .pipe(
        tap((items) => {
          this.items = items;
        }),
        concatMap(() => this.dataService.getPrices()),
        tap((prices) => {
          this.prices = prices;
        })
      )
      .subscribe(() => {
        this.setupItemToPriceMap();
      });
  }

  setupItemToPriceMap() {
    this.itemToPricesMap = this.items.reduce(
      (acc: Record<string, ItemPrice[]>, item) => {
        acc[item.itemId] = this.prices.filter((x) => x.itemId === item.itemId);

        return acc;
      },
      {}
    );
  }

  toggleCollapse(event: Event, itemId: number) {
    this.activeItemId = this.activeItemId === itemId ? null : itemId;
  }

  ngOnDestroy(): void {
    this.setupSubscription.unsubscribe();
  }
}
