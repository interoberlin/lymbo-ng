import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Media} from '../../../../../core/ui/model/media.enum';
import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {User} from 'firebase';
import {CardsDisplayMode} from '../../../../../core/settings/model/cards-display-mode.enum';

/**
 * Displays cards toolbar
 */
@Component({
  selector: 'app-cards-toolbar',
  templateUrl: './cards-toolbar.component.html',
  styleUrls: ['./cards-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardsToolbarComponent implements OnInit {

  /** Title displayed in the toolbar */
  @Input() title;
  /** Title color */
  @Input() titleColor = 'black';
  /** Current media */
  @Input() media: Media;
  /** Search items options for auto-complete */
  @Input() searchOptions = [];
  /** Indicates whether a filter for favorite cards is active */
  @Input() filterFavorites = false;
  /** Indicates whether a filter is active */
  @Input() filterActive = false;
  /** Indicates whether cards are in multiple boxes */
  @Input() cardsAreInMultipleBoxes = false;
  /** Indicates that stack is not empty */
  @Input() stackNotEmpty = false;
  /** Current user */
  @Input() user: User;
  /** Cards display mode */
  @Input() cardsDisplayMode: CardsDisplayMode;
  /** Event emitter indicating changes in search bar */
  @Output() searchItemEventEmitter = new EventEmitter<string>();
  /** Event emitter indicating menu items being clicked */
  @Output() menuItemEventEmitter = new EventEmitter<string>();

  /** Enum for media types */
  mediaType = Media;
  /** Enum for cards display mode */
  cardsDisplayModeType = CardsDisplayMode;

  /** Current search item */
  searchItem = '';
  /** Debouncer for search field */
  searchItemDebouncer = new Subject();
  /** Filtered search items options for auto-complete */
  searchOptionsFiltered: string[];

  //
  // Lifecycle hooks
  //

  /**
   * Handles on-init lifecycle phase
   */
  ngOnInit() {
    this.initializeOptions();
    this.initializeDebouncer();
  }

  //
  // Initialization
  //

  /**
   * Initialize auto-complete options
   */
  private initializeOptions() {
    this.searchOptionsFiltered = this.searchOptions;
  }

  /**
   * Initializes search options filter
   */
  private initializeDebouncer() {
    this.searchItemDebouncer.pipe(
      debounceTime(500)
    ).subscribe((value) => {
      this.searchItemEventEmitter.emit(value.toString());
    });
  }

  //
  // Actions
  //

  /** Handles click on menu item
   * @param menuItem menu item
   */
  onMenuItemClicked(menuItem: string): void {
    this.menuItemEventEmitter.emit(menuItem);
  }

  /**
   * Handles changes in search item
   * @param searchItem search item
   */
  onSearchItemChanged(searchItem: string) {
    this.searchItem = searchItem;
    this.searchOptionsFiltered = this.filterOptions(this.searchItem);
    this.searchItemDebouncer.next(this.searchItem);
  }

  /**
   * Handles click on search field
   */
  onSearchFieldClicked() {
    this.filterOptions(this.searchItem);
  }

  /**
   * Handles key up event
   */
  onKeyUp() {
    this.searchItemDebouncer.next(this.searchItem);
  }

  /**
   * Handles option selection
   */
  onOptionSelected() {
    this.searchItemDebouncer.next(this.searchItem);
  }

  /**
   * Handles click on clear button
   */
  onClearButtonClicked() {
    this.searchItem = '';
    this.searchItemDebouncer.next(this.searchItem);
  }

  //
  // Filters
  //

  /**
   * Filters options according to current value of input field
   * @param value input field value
   * @returns array of filtered options
   */
  private filterOptions(value: string): string[] {
    return this.searchOptions.filter(option =>
      option.toLowerCase().includes(value.toLowerCase())
    );
  }
}
