export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
  };
  organization?: string;
  dateOfEnrollment?: string;
  contactNumber?: string;
  address?: string;
  preferences?: {
    theme?: string;
    language?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
  };
  organization?: string;
  dateOfEnrollment?: string;
  contactNumber?: string;
  address?: string;
  preferences?: {
    theme?: string;
    language?: string;
  };
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  role?: 'user' | 'admin';
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
  };
  organization?: string;
  dateOfEnrollment?: string;
  contactNumber?: string;
  address?: string;
  preferences?: {
    theme?: string;
    language?: string;
  };
  isActive?: boolean;
}

export interface UsersResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface UserResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export interface UserSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: string;
}

