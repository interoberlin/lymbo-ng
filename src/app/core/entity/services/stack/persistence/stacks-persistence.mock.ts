import {User} from 'firebase';
import {Stack} from '../../../model/stack/stack.model';
import {Subject} from 'rxjs';

/**
 * Interface containing stacks persistence methods
 */
export class StacksPersistenceServiceMock {

  /** Map of all stacks */
  stacks: Map<string, Stack>;
  /** Subject that publishes stacks */
  stacksSubject: Subject<Stack[]>;

  /** Stack in focus */
  stack: Stack;
  /** Subject that publishes stack */
  stackSubject: Subject<Stack>;

  //
  // Cancel
  //

  /**
   * Cancels subscription
   */
  cancelSubscription() {
  }

  //
  // Read
  //

  /**
   * Finds all stacks
   * @param user user (optional)
   */
  findStacks(user?: User) {
  }

  /**
   * Finds stack by a given ID
   * @param user user (optional)
   * @param id ID of filter by
   */
  findStackByID(id: string, user?: User) {
  }

  //
  // Create
  //

  /**
   * Creates a new stack
   * @param stack stack to be created
   */
  createStack(stack: Stack): Promise<any> {
    return null;
  }

  /**
   * Creates new stacks
   * @param stacks stacks to be created
   */
  createStacks(stacks: Stack[]): Promise<any> {
    return null;
  }

  //
  // Update
  //

  /**
   * Updates an existing stack
   * @param stack stack to be updated
   */
  updateStack(stack: Stack): Promise<any> {
    return null;
  }

  /**
   * Updates existing stacks
   * @param stacks stacks to be updated
   */
  updateStacks(stacks: Stack[]): Promise<any> {
    return null;
  }

  //
  // Delete
  //

  /**
   * Deletes a stack
   * @param stack stack to be deleted
   */
  deleteStack(stack: Stack): Promise<any> {
    return null;
  }

  /**
   * Deletes an array of stacks
   * @param stacks stacks
   */
  deleteStacks(stacks: Stack[]): Promise<any> {
    return null;
  }

  //
  // Others
  //

  /**
   * Uploads a stack
   * @param stack stack
   * @param owner user that will be the new owner of this stack
   */
  uploadStack(stack: Stack, owner?: User) {
  }

  /**
   * Clears all stacks
   */
  clearStacks() {
  }

  /**
   * Informs subscribers that something has changed
   */
  notifyMultipleStacks() {
  }

  /**
   * Informs subscribers that something has changed
   */
  notifySingleStack() {
  }
}
