import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {Stack} from '../../model/stack/stack.model';
import {PouchDBService} from '../../../persistence/services/pouchdb.service';
import {StacksService} from '../stack/stacks.service';
import {TagService} from '../tag.service';
import {CardDisplayService, DisplayAspect} from './card-display.service';
import {CardTypeService} from './card-type.service';
import {Card} from '../../model/card/card.model';
import {CardTypeGroup} from '../../model/card/card-type-group.enum';
import {CardType} from '../../model/card/card-type.enum';
import {Tag} from '../../model/tag.model';

/**
 * Handles cards
 */
@Injectable({
  providedIn: 'root'
})
export class CardsService {

  /** Stack in focus */
  stack: Stack;

  /** Map of all cards */
  cards = new Map<String, Card>();
  /** Subject that publishes cards */
  cardsSubject = new Subject<Card[]>();

  /** Whether all cards are flipped */
  viceVersa = false;

  //
  // Delegated: Display aspects
  //

  /**
   * Determines if a given cardlet contains a display aspect
   * @param displayAspect display aspect
   * @param card card
   */
  static containsDisplayAspect(displayAspect: DisplayAspect, card: Card): boolean {
    switch (displayAspect) {
      case DisplayAspect.CAN_BE_CREATED: {
        return CardDisplayService.canBeCreated(card);
      }
      case DisplayAspect.CAN_BE_UPDATED: {
        return CardDisplayService.canBeUpdated(card);
      }
      case DisplayAspect.TITLES: {
        return CardDisplayService.containsTitles(card);
      }
      case DisplayAspect.TENSES: {
        return CardDisplayService.containsTenses(card);
      }
      case DisplayAspect.EXAMPLES: {
        return CardDisplayService.containsExamples(card);
      }
      case DisplayAspect.INFORMATION: {
        return CardDisplayService.containsInformation(card);
      }
      case DisplayAspect.SINGLE_CHOICE_QUIZ: {
        return CardDisplayService.containsSingleChoiceQuiz(card);
      }
      case DisplayAspect.MULTIPLE_CHOICE_QUIZ: {
        return CardDisplayService.containsMultipleChoiceQuiz(card);
      }
    }
  }

  //
  // Sort
  //

  /**
   * Sorts cards based on their modification date
   * @param cardA first card
   * @param cardB seconds card
   */
  static sortCards(cardA: Card, cardB: Card) {
    return (!isNaN(cardA.index) && !isNaN(cardB.index)) ? cardB.index - cardA.index : 0;
  }

  /**
   * Shuffles cards
   * @param cards cards
   */
  static shuffleCards(cards: Card[]): Card[] {
    let currentIndex = cards.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = cards[currentIndex];
      cards[currentIndex] = cards[randomIndex];
      cards[randomIndex] = temporaryValue;
    }

    return cards;
  }

  //
  // Lookup
  //

  /**
   * Get minimum index of a given list of cards
   * @param cards cards
   */
  static getMinIndex(cards: Card[]): number {
    const min = Math.min(...cards.map(card => {
      return card.index;
    }).filter(index => {
      return !isNaN(index);
    }));

    return !isNaN(min) ? min : 0;
  }

  /**
   * Get maximum index of a given list of cards
   * @param cards cards
   */
  static getMaxIndex(cards: Card[]): number {
    const max = Math.max(...cards.map(card => {
      return card.index;
    }).filter(index => {
      return !isNaN(index);
    }));

    return !isNaN(max) ? max : 0;
  }

  /**
   * Constructor
   * @param cardTypeService card type service
   * @param pouchDBService pouchDB service
   * @param stackService stack service
   * @param tagService tag service
   */
  constructor(private cardTypeService: CardTypeService,
              private pouchDBService: PouchDBService,
              private stackService: StacksService,
              private tagService: TagService) {
  }

  //
  // Initialization
  //

  /**
   * Initializes stack
   * @param stack stack
   */
  public initializeStack(stack: Stack) {
    this.stack = stack;
  }

  /**
   * Initializes cards
   * @param cards cards
   */
  public initializeCards(cards: Card[]) {
    this.clearCards();
    cards.forEach(card => {
      this.cards.set(card.id, card);
    });
    this.notify();
  }

  /**
   * Clears cards
   */
  public clearCards() {
    this.cards.clear();
    this.notify();
  }

  //
  // Persistence
  //

  /**
   * Updates existing stack
   * @param stack stack
   */
  public updateStack(stack): Promise<any> {
    return new Promise((resolve) => {
      this.updateRelatedStack(stack).then(() => {
        this.notify();
        resolve();
      });
    });
  }

  /**
   * Creates a new card
   * @param card card to be created
   */
  public createCard(card: Card): Promise<any> {
    return new Promise((resolve, reject) => {
      if (card == null) {
        reject();
      }

      card.index = CardsService.getMaxIndex(Array.from(this.cards.values())) + 1;

      this.addCardToStack(this.stack, card);
      resolve();
    });
  }

  /**
   * Updates an existing card
   * @param card card to be updated
   */
  public updateCard(card: Card): Promise<any> {
    return new Promise((resolve, reject) => {
      if (card == null) {
        reject();
      }

      // Set modification date
      card.modificationDate = new Date();

      this.updateCardOfStack(this.stack, card);
      resolve();
    });
  }

  /**
   * Deletes a card
   * @param {Card} card card to be deleted
   */
  public deleteCard(card: Card): Promise<any> {
    return new Promise((resolve, reject) => {
      if (card == null) {
        reject();
      }


      this.removeCardFromStack(this.stack, card);
      resolve();
    });
  }

  /**
   * Updates related tags
   * @param card card
   */
  public updateRelatedTags(card: Card): Promise<any> {
    return new Promise((resolve) => {
      card.tagIds.forEach(id => {
        const tag = this.tagService.getTagById(id);
        this.tagService.updateTag(tag, false).then(() => {
          resolve();
        });
      });
    });
  }

  /**
   * Adds card to stack
   * @param stack stack
   * @param card card
   */
  private addCardToStack(stack: Stack, card: Card) {
    this.stack.cards.push(card);
    this.updateRelatedStack(stack).then(() => {
      this.notify();
    });
  }

  /**
   * Updates card of stack
   * @param stack stack
   * @param card card
   */
  private updateCardOfStack(stack: Stack, card: Card) {
    // Get index of the card to be updated
    const index = stack.cards.findIndex(c => {
      return c.id === card.id;
    });

    // Update the card
    stack.cards[index] = card;

    this.updateRelatedStack(stack).then(() => {
      this.notify();
    });
  }

  /**
   * Removes card from stack
   * @param stack stack
   * @param card card
   */
  private removeCardFromStack(stack: Stack, card: Card) {
    // Filter out the card
    this.stack.cards = this.stack.cards.filter(c => {
      return c.id !== card.id;
    });

    this.updateRelatedStack(stack).then(() => {
      this.notify();
    });
  }

  //
  // State
  //

  /**
   * Puts card a the end of a stack
   * @param stack stack
   * @param card card
   */
  public putCardToEnd(stack: Stack, card: Card): Promise<any> {
    return new Promise((resolve) => {
      card.index = CardsService.getMinIndex(Array.from(this.cards.values())) - 1;
      this.updateCard(card).then(() => {
        resolve();
      });
    });
  }

  /**
   * Moves card to next stack
   * @param stack stack
   * @param card card
   */
  public moveCardToNextBox(stack: Stack, card: Card): Promise<any> {
    return new Promise((resolve) => {
      card.box != null ? card.box++ : card.box = 1;
      this.updateCard(card).then(() => {
        resolve();
      });
    });
  }

  /**
   * Moves all cards to the first box
   * @param stack stack
   */
  public moveAllCardsToFirstBox(stack) {
    return new Promise((resolve) => {
      stack.cards.forEach(card => {
        card.box = 0;
      });
      this.updateStack(stack).then(() => {
        resolve();
      });
    });
  }

  /**
   * Normalizes card indices of a stack starting with zero
   * @param stack stack
   */
  public normalizesStackIndices(stack: Stack): Promise<any> {
    return new Promise((resolve) => {
      let index = 0;

      // Assign new indices to cards
      stack.cards.forEach(card => {
        card.index = index++;
      });
      resolve();
    });
  }

  /**
   * Shuffles cards of a given stack
   * @param stack stack
   */
  public shuffleStack(stack: Stack): Promise<any> {
    return new Promise((resolve) => {
      let index = 0;

      // Assign new indices to shuffled cards
      CardsService.shuffleCards(stack.cards).forEach(card => {
        card.index = index++;
      });

      this.updateStack(stack).then(() => {
        resolve();
      });
    });
  }

  /**
   * Toggles favorite
   * @param stack stack
   * @param card card
   * @param favorite favorite
   */
  public setFavorite(stack: Stack, card: Card, favorite: boolean) {
    return new Promise((resolve) => {
      card.favorite = favorite;
      this.updateCard(card).then(() => {
        resolve();
      });
    });
  }

  /**
   * Updates related stack
   * @param stack stack
   */
  private updateRelatedStack(stack: Stack): Promise<any> {
    return new Promise((resolve) => {
      this.stackService.updateStack(stack).then(() => {
        resolve();
      });
    });
  }

  /**
   * Toggles vice versa
   */
  public toggleViceVersa() {
    this.viceVersa = !this.viceVersa;
  }

  //
  // Lookup
  //

  /**
   * Returns the needed number of boxes
   * @param cards cards
   */
  public getBoxCount(cards: Card[]): number {
    let boxCount = 0;
    cards.forEach(card => {
      if (card.box != null && card.box > boxCount) {
        boxCount = card.box;
      }
    });

    return boxCount + 1;
  }

  /**
   * Determines whether a tag is contained in a list of cards
   * @param cards cards
   * @param tag tag
   */
  public tagIsContainedInCards(cards: Card[], tag: Tag) {
    return this.getTagIdsByCards(cards).some(id => {
      return id === tag.id;
    });
  }

  /**
   * Aggregates all tag IDs of a list of given cards
   * @param cards cards
   */
  private getTagIdsByCards(cards: Card[]): string[] {
    const tagIds = new Map<string, string>();

    cards.forEach(card => {
      card.tagIds.forEach(tagId => {
        tagIds.set(tagId, tagId);
      });
    });

    return Array.from(tagIds.values());
  }

  //
  // Delegated: card types
  //

  /**
   * Returns a list of card types contained in a given card type group
   * @param group card type group
   */
  public getCardTypesByGroup(group: CardTypeGroup): CardType[] {
    return this.cardTypeService.getCardTypesByGroup(group);
  }

  /**
   * Returns the card type group of a given card type
   * @param type card type
   */
  public getCardGroupByType(type: CardType): CardTypeGroup {
    return this.cardTypeService.getCardGroupByType(type);
  }

  /**
   * Determines if a card type group contains a given card type
   * @param group card type group
   * @param type card type
   */
  public groupContainsType(group: CardTypeGroup, type: CardType) {
    return this.cardTypeService.groupContainsType(group, type);
  }

  /**
   * Retrieves an icon by card type
   * @param group card type group
   */
  public getIconByCardTypeGroup(group: CardTypeGroup): string {
    return this.cardTypeService.getIconByCardTypeGroup(group);
  }

  /**
   * Retrieves an icon by card type
   * @param type card type
   */
  public getIconByCardType(type: CardType): string {
    return this.cardTypeService.getIconByCardType(type);
  }

  //
  // Notification
  //

  /**
   * Informs subscribers that something has changed
   */
  public notify() {
    this.cardsSubject.next(Array.from(this.cards.values()).sort(CardsService.sortCards));
  }
}
