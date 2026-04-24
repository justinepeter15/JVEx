export type ResourceType = 'exam' | 'book' | 'lesson_plan' | 'other';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  isPremium: boolean;
  subscriptionExpiresAt?: any;
  purchasedResources?: string[]; // IDs of resources the user has paid for individually
  createdAt: any;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  category: string;
  isPremium: boolean;
  price?: number; // Price of the resource
  fileUrl: string;
  thumbnailUrl: string;
  authorId: string;
  downloadCount: number;
  averageRating?: number;
  reviewCount?: number;
  createdAt: any;
}

export type FirestoreErrorInfo = {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
};
