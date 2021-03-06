import {Injectable} from '@angular/core';
import {StacksPersistenceService} from './stacks-persistence.interface';
import {Subject} from 'rxjs';
import {User} from 'firebase';
import {Stack} from '../../../model/stack/stack.model';
import {FirebaseCloudFirestoreService} from '../../../../firebase/services/firebase-cloud-firestore.service';
import {TagsService} from '../../tag/tags.service';
import {UUID} from '../../../model/uuid';
import {LogService} from '../../../../log/services/log.service';
import {ConnectionService} from '../../../../common/services/connection.service';

/**
 * Handles stack persistence via Firestore
 */
@Injectable({
  providedIn: 'root'
})
export class StacksFirestoreService implements StacksPersistenceService {

  /** Map of all stacks */
  stacks = new Map<string, Stack>();
  /** Subject that publishes stacks */
  stacksSubject = new Subject<Stack[]>();

  /** Stack in focus */
  stack: Stack;
  /** Subject that publishes stack */
  stackSubject = new Subject<Stack>();

  /** Subject that publishes database errors */
  databaseErrorSubject = new Subject<string>();

  /**
   * Constructor
   * @param firebaseCloudFirestoreService Firebase Cloud Firestore service
   * @param tagsService tags service
   */
  constructor(private firebaseCloudFirestoreService: FirebaseCloudFirestoreService,
              private tagsService: TagsService) {
    this.initializeStacksSubscription();
    this.initializeStackSubscription();
  }

  //
  // Initialization
  //

  /**
   * Initializes stacks subscription from Firestore
   */
  private initializeStacksSubscription() {
    LogService.trace(`StacksFirestoreService#initializeStacksSubscription`);
    this.firebaseCloudFirestoreService.stacksSubject.subscribe(stacks => {
      stacks.forEach(element => {
        const stack = element as Stack;
        this.stacks.set(stack.id, stack);
      });
      this.notifyMultipleStacks();
    });
  }

  /**
   * Initializes stack subscription from Firestore
   */
  private initializeStackSubscription() {
    this.firebaseCloudFirestoreService.stackSubject.subscribe(stack => {
      this.stack = stack;
      this.notifySingleStack();
    });
  }

  //
  // Cancel
  //

  /**
   * Cancels subscription
   */
  public cancelSubscription() {
    this.firebaseCloudFirestoreService.cancelSubscription();
  }

  //
  // Read
  //

  /**
   * Loads stacks from Firestore
   * @param user user
   */
  public findStacks(user: User) {
    LogService.trace(`StacksFirestoreService#findStacks`);
    this.firebaseCloudFirestoreService.readStacks(user);
  }

  /**
   * Finds stack by a given ID
   * @param id ID of the stack
   * @param user user
   */
  public findStackByID(id: string, user: User) {
    LogService.trace(`StacksFirestoreService#findStackById`);
    this.firebaseCloudFirestoreService.readStacksByID(user, id);
  }

  //
  // Create
  //

  /**
   * Creates a new stack
   * @param stack stack to be created
   */
  public createStack(stack: Stack): Promise<any> {
    LogService.trace(`StacksFirestoreService#createStack`);
    return new Promise((resolve, reject) => {
      if (stack == null) {
        reject();
      }

      // Update related objects
      this.updateRelatedTags(stack, stack.tagIds);

      if (ConnectionService.isOnline()) {
        // Create stack
        return this.firebaseCloudFirestoreService.addStack(stack).then(() => {
          resolve();
        }).catch(error => {
          this.notifyDatabaseError(error);
          reject();
        });
      } else {
        this.stacks.set(stack.id, stack);
        this.notifyMultipleStacks();
        this.notifySingleStack();
        resolve();
      }
    });
  }

  /**
   * Creates new stacks
   * @param stacks stacks to be created
   */
  public createStacks(stacks: Stack[]): Promise<any> {
    LogService.trace(`StacksFirestoreService#createStacks`);
    return new Promise((resolve) => {

      // Create stacks
      if (ConnectionService.isOnline()) {
        return this.firebaseCloudFirestoreService.addStacks(stacks).then(() => {
          resolve();
        });
      } else {
        stacks.forEach(stack => {
          this.stacks.set(stack.id, stack);
        });
        this.notifyMultipleStacks();
        this.notifySingleStack();
        resolve();
      }
    });
  }

  //
  // Update
  //

  /**
   * Updates an existing stack
   * @param stack stack to be updated
   */
  public updateStack(stack: Stack): Promise<any> {
    LogService.trace(`StacksFirestoreService#updateStack ${stack.id}`);
    return new Promise((resolve, reject) => {
      if (stack == null) {
        reject();
      }

      // Update related objects
      this.updateRelatedTags(stack, stack.tagIds);

      // Set modification date
      stack.modificationDate = new Date();

      if (ConnectionService.isOnline()) {
        // Update stack
        return this.firebaseCloudFirestoreService.updateStack(stack).then(() => {
          resolve();
        });
      } else {
        this.stack = stack;
        this.stacks.set(stack.id, stack);
        this.notifyMultipleStacks();
        this.notifySingleStack();
        resolve();
      }
    });
  }

  /**
   * Updates existing stacks
   * @param stacks stacks to be updated
   */
  public updateStacks(stacks: Stack[]): Promise<any> {
    LogService.trace(`StacksFirestoreService#updateStacks`);
    return new Promise((resolve) => {

      if (ConnectionService.isOnline()) {
        // Create stacks
        return this.firebaseCloudFirestoreService.updatesStacks(stacks).then(() => {
          resolve();
        });
      } else {
        stacks.forEach(stack => {
          this.stacks.set(stack.id, stack);
        });
        this.notifyMultipleStacks();
        this.notifySingleStack();
        resolve();
      }
    });
  }

  //
  // Delete
  //

  /**
   * Deletes a stack
   * @param stack stack to be deleted
   */
  public deleteStack(stack: Stack): Promise<any> {
    LogService.trace(`StacksFirestoreService#deleteStack`);
    return new Promise((resolve, reject) => {
      if (stack == null) {
        reject();
      }

      // Delete stack
      return this.firebaseCloudFirestoreService.deleteStack(stack).then(() => {
        resolve();
      });
    });
  }

  /**
   * Deletes an array of stacks
   * @param stacks stacks
   */
  public deleteStacks(stacks: Stack[]): Promise<any> {
    LogService.trace(`StacksFirestoreService#deleteStacks`);
    return new Promise((resolve) => {

      // Delete stacks
      return this.firebaseCloudFirestoreService.deleteStacks(stacks).then(() => {
        resolve();
      });
    });
  }

  //
  // Others
  //

  /**ca
   * Uploads a stack
   * @param stack stack
   * @param owner user that will be the new owner of this stack
   */
  public uploadStack(stack: Stack, owner: User): Promise<any> {
    LogService.trace(`StacksFirestoreService#uploadStack`);
    stack.id = new UUID().toString();
    stack.owner = owner.uid;

    return this.firebaseCloudFirestoreService.addStack(stack);
  }

  /**
   * Clears stacks
   */
  public clearStacks() {
    this.stacks.clear();
  }

  /**
   * Informs subscribers that something has changed
   */
  public notifyMultipleStacks() {
    LogService.trace(`StacksFirestoreService#notifyMultipleStacks`);
    this.stacksSubject.next(Array.from(this.stacks.values()).sort((t1, t2) => {
      return new Date(t2.modificationDate).getTime() - new Date(t1.modificationDate).getTime();
    }));
  }

  /**
   * Informs subscribers that something has changed
   */
  public notifySingleStack() {
    LogService.trace(`StacksFirestoreService#notifySingleStack`);
    this.stackSubject.next(this.stack);
  }

  /**
   * Notifies subscribers that a database error occurs
   * @param error error
   */
  public notifyDatabaseError(error: any) {
    LogService.fatal(error);
    this.databaseErrorSubject.next(error);
  }

  //
  // Internal
  //

  /**
   * Updates related tags
   * @param stack stack
   * @param tagIds tag IDs
   */
  private updateRelatedTags(stack: Stack, tagIds: string[]) {
    LogService.trace(`StacksFirestoreService#updateRelatedTags`);
    tagIds.forEach(id => {
      const tag = this.tagsService.getTagById(id);
      if (tag != null) {
        this.tagsService.updateTag(stack, tag).then(() => {
        }).catch(error => {
          this.notifyDatabaseError(error);
        });
      }
    });
  }
}
