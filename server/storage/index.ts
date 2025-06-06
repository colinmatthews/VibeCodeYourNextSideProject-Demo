import { UserStorage } from './UserStorage';
import { ItemStorage } from './ItemStorage';
import { ComponentStorage } from './ComponentStorage';
import { type Item, type InsertItem, type User, type InsertUser, type Component, type InsertComponent, type UpdateComponent } from "@shared/schema";

interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  emailNotifications?: boolean;
  subscriptionType?: "free" | "pro";
  stripeCustomerId?: string;
}

export interface IStorage {
  // User operations
  getUserByFirebaseId(firebaseId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(firebaseId: string, data: UpdateUserData): Promise<User>;

  // Item operations
  getItemsByUserId(userId: string): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  deleteItem(id: number): Promise<void>;

  // Component operations
  getComponentsByUserId(userId: string): Promise<Component[]>;
  getComponentById(id: string, userId: string): Promise<Component | undefined>;
  createComponent(component: InsertComponent): Promise<Component>;
  updateComponent(id: string, userId: string, data: UpdateComponent): Promise<Component>;
  deleteComponent(id: string, userId: string): Promise<void>;
  getComponentCount(userId: string): Promise<number>;
}

export class PostgresStorage implements IStorage {
  private userStorage: UserStorage;
  private itemStorage: ItemStorage;
  private componentStorage: ComponentStorage;

  constructor() {
    this.userStorage = new UserStorage();
    this.itemStorage = new ItemStorage();
    this.componentStorage = new ComponentStorage();
  }

  // User operations
  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    return this.userStorage.getUserByFirebaseId(firebaseId);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.userStorage.getUserByEmail(email);
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.userStorage.createUser(user);
  }

  async updateUser(firebaseId: string, data: UpdateUserData): Promise<User> {
    return this.userStorage.updateUser(firebaseId, data);
  }

  // Item operations
  async getItemsByUserId(userId: string): Promise<Item[]> {
    return this.itemStorage.getItemsByUserId(userId);
  }

  async createItem(item: InsertItem): Promise<Item> {
    return this.itemStorage.createItem(item);
  }

  async deleteItem(id: number): Promise<void> {
    return this.itemStorage.deleteItem(id);
  }

  // Component operations
  async getComponentsByUserId(userId: string): Promise<Component[]> {
    return this.componentStorage.getComponentsByUserId(userId);
  }

  async getComponentById(id: string, userId: string): Promise<Component | undefined> {
    return this.componentStorage.getComponentById(id, userId);
  }

  async createComponent(component: InsertComponent): Promise<Component> {
    return this.componentStorage.createComponent(component);
  }

  async updateComponent(id: string, userId: string, data: UpdateComponent): Promise<Component> {
    return this.componentStorage.updateComponent(id, userId, data);
  }

  async deleteComponent(id: string, userId: string): Promise<void> {
    return this.componentStorage.deleteComponent(id, userId);
  }

  async getComponentCount(userId: string): Promise<number> {
    return this.componentStorage.getComponentCount(userId);
  }
}

export const storage = new PostgresStorage();
export { UpdateUserData };