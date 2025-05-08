import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Item, Size, Price, ItemPrice } from '../models/item.model';
import { initialState } from '../models/data';
import { AppSettings } from '../app.settings';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private localStorageKey = 'pizzaMenuData';
  originalPrices: ItemPrice[] = [];

  private itemsSubject: BehaviorSubject<Item[]>;
  private sizesSubject: BehaviorSubject<Size[]>;
  private pricesSubject: BehaviorSubject<ItemPrice[]>;

  items$: Observable<Item[]>;
  sizes$: Observable<Size[]>;
  prices$: Observable<ItemPrice[]>;

  constructor() {
    const data = this.getDataFromLocalStorage();
    this.itemsSubject = new BehaviorSubject(data.items);
    this.sizesSubject = new BehaviorSubject(data.sizes);
    this.pricesSubject = new BehaviorSubject(
      this.getItemPriceSubjectInitialValue(data.prices, data.sizes)
    );
    this.originalPrices = structuredClone(this.pricesSubject.value);
    this.items$ = this.itemsSubject.asObservable();
    this.sizes$ = this.sizesSubject.asObservable();
    this.prices$ = this.pricesSubject.asObservable();
  }

  getItemPriceSubjectInitialValue(prices: Price[], sizes: Size[]) {
    return prices.reduce((acc: ItemPrice[], price: Price) => {
      const size = sizes.find((size) => size.sizeId === price.sizeId);
      if (!size?.name) {
        return acc;
      }
      acc.push({
        ...price,
        isSelected:
          !AppSettings.shouldDisableSelectionWhenPriceZero || price.price > 0,
        sizeName: size?.name,
      });
      return acc as ItemPrice[];
    }, []);
  }

  getItems(): Observable<Item[]> {
    return this.items$;
  }

  getSizes(): Observable<Size[]> {
    return this.sizes$;
  }

  getPrices(): Observable<ItemPrice[]> {
    return this.prices$;
  }

  updateItem(itemId: number, updatedPrices: ItemPrice[]) {
    const next = this.pricesSubject.value
      .filter(
        (x) =>
          x.itemId !== itemId &&
          updatedPrices.some((p) => p.sizeId === x.sizeId)
      )
      .concat(updatedPrices);

    this.pricesSubject.next(next);
    this.saveDataToLocalStorage({
      prices: next.map(({ isSelected, sizeName, ...price }) => price),
    });
  }

  saveDataToLocalStorage(
    data: Partial<{
      items: Item[];
      sizes: Size[];
      prices: Price[];
    }>
  ): void {
    localStorage.setItem(
      this.localStorageKey,
      JSON.stringify({
        ...this.getDataFromLocalStorage(),
        ...data,
      })
    );
  }

  isObject(value: any) {
    return (
      !!value &&
      typeof value === 'object' &&
      !(value instanceof Date) &&
      !Array.isArray(value)
    );
  }

  private validateItems(items: any) {
    return (
      Array.isArray(items) &&
      items.every(
        (x) =>
          this.isObject(x) &&
          typeof x.itemId === 'number' &&
          typeof x.name === 'string'
      )
    );
  }

  private validatePrices(prices: any) {
    return (
      Array.isArray(prices) &&
      prices.every(
        (x) =>
          this.isObject(x) &&
          typeof x.itemId === 'number' &&
          typeof x.sizeId === 'number' &&
          typeof x.price === 'number' &&
          x.price >= 0
      )
    );
  }

  private validateSizes(sizes: any) {
    return (
      Array.isArray(sizes) &&
      sizes.every(
        (x) =>
          this.isObject(x) &&
          typeof x.sizeId === 'number' &&
          typeof x.name === 'string'
      )
    );
  }

  private getValidatedData(stringifiedData: string | null) {
    try {
      if (stringifiedData) {
        const data = JSON.parse(stringifiedData);
        if (
          [
            this.validateItems(data.items),
            this.validatePrices(data.prices),
            this,
            this.validateSizes(data.sizes),
          ].every(Boolean) ||
          !AppSettings.validateInitialData
        ) {
          return data as {
            items: Item[];
            sizes: Size[];
            prices: Price[];
          };
        }
      }

      return structuredClone(initialState);
    } catch (error) {
      return structuredClone(initialState);
    }
  }

  private getDataFromLocalStorage(): {
    items: Item[];
    sizes: Size[];
    prices: Price[];
  } {
    const storedData = localStorage.getItem(this.localStorageKey);

    return this.getValidatedData(storedData);
  }
}
