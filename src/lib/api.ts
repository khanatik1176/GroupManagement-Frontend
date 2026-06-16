import type {
  BirthdayBanner,
  ChatFeedItem,
  ChatPoll,
  ExpenseEntry,
  FoodPoll,
  FoodPost,
  FoodPostComment,
  LoginResponse,
  Message,
  RegistryPoll,
  TreatRecord,
  User,
  EventType,
} from "@/types";

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type ApiFieldErrors = Record<string, string>;

export class ApiRequestError extends Error {
  status: number;
  fieldErrors: ApiFieldErrors;
  generalError?: string;

  constructor(
    message: string,
    status: number,
    fieldErrors: ApiFieldErrors = {},
    generalError?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.generalError = generalError;
  }
}

type RequestOptions = RequestInit & {
  params?: Record<string, string>;
  auth?: boolean;
};

function firstErrorMessage(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstErrorMessage(item);
      if (message) return message;
    }
    return undefined;
  }
  if (value && typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      const message = firstErrorMessage(nested);
      if (message) return message;
    }
  }
  return undefined;
}

function parseApiErrorBody(body: Record<string, unknown>) {
  const fieldErrors: ApiFieldErrors = {};
  let generalError: string | undefined;

  if (typeof body.detail === "string") {
    generalError = body.detail;
  } else if (Array.isArray(body.detail)) {
    generalError = body.detail.map(String).join(" ");
  }

  if (!generalError && Array.isArray(body.non_field_errors)) {
    generalError = body.non_field_errors.map(String).join(" ");
  }

  for (const [key, value] of Object.entries(body)) {
    if (key === "detail") continue;
    const message = firstErrorMessage(value);
    if (message) fieldErrors[key] = message;
  }

  const message =
    generalError ??
    Object.values(fieldErrors)[0] ??
    "Request failed. Please check your input.";

  return { message, fieldErrors, generalError };
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const response = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = (await response.json()) as { access: string };
  setTokens(data.access, refresh);
  return data.access;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, auth = true, ...rest } = options;
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const makeRequest = async (token?: string | null) =>
    fetch(url.toString(), {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });

  let token = auth ? getAccessToken() : null;
  let response = await makeRequest(token);

  if (response.status === 401 && auth) {
    token = await refreshAccessToken();
    if (token) {
      response = await makeRequest(token);
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let fieldErrors: ApiFieldErrors = {};
    let generalError: string | undefined;

    try {
      const errorBody = (await response.json()) as Record<string, unknown>;
      const parsed = parseApiErrorBody(errorBody);
      message = parsed.message;
      fieldErrors = parsed.fieldErrors;
      generalError = parsed.generalError;
    } catch {
      // ignore parse errors
    }

    throw new ApiRequestError(message, response.status, fieldErrors, generalError);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),
  patch: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};

// Auth
export const login = (username: string, password: string) =>
  api.post<LoginResponse>(
    "/api/auth/login/",
    { username, password },
    { auth: false },
  );

export const getProfile = () => api.get<User>("/api/auth/profile/");
export const updateProfile = (data: Partial<User>) =>
  api.patch<User>("/api/auth/profile/", data);

// Users
export const getMembers = () => api.get<User[]>("/api/auth/members/");
export const getUsers = () => api.get<User[]>("/api/auth/users/");
export const createUser = (data: Record<string, unknown>) =>
  api.post<User>("/api/auth/users/", data);
export const updateUser = (id: number, data: Record<string, unknown>) =>
  api.patch<User>(`/api/auth/users/${id}/`, data);
export const deleteUser = (id: number) =>
  api.delete(`/api/auth/users/${id}/`);
export const toggleUserStatus = (id: number) =>
  api.post<User>(`/api/auth/users/${id}/toggle_status/`);

// Chat
export const getChatFeed = () => api.get<ChatFeedItem[]>("/api/chat/feed/");
export const getMessages = () => api.get<Message[]>("/api/chat/messages/");
export const sendMessage = (content: string) =>
  api.post<Message>("/api/chat/messages/", { content });
export const updateMessage = (id: number, content: string) =>
  api.patch<Message>(`/api/chat/messages/${id}/`, { content });
export const deleteMessage = (id: number) =>
  api.delete(`/api/chat/messages/${id}/`);
export const getChatPolls = () => api.get<ChatPoll[]>("/api/chat/polls/");
export const createChatPoll = (data: { title: string; options: string[] }) =>
  api.post<ChatPoll>("/api/chat/polls/", data);
export const voteChatPoll = (pollId: number, optionId: number) =>
  api.post<ChatPoll>(`/api/chat/polls/${pollId}/vote/`, { option_id: optionId });
export const deleteChatPoll = (id: number) =>
  api.delete(`/api/chat/polls/${id}/`);

// Poll registry (all sections, read-only overview)
export const getPollRegistry = () =>
  api.get<RegistryPoll[]>("/api/polls/registry/");

// Food
export const getFoodPosts = () => api.get<FoodPost[]>("/api/food/posts/");
export const createFoodPost = (data: {
  title: string;
  description: string;
  place_name: string;
  place_latitude?: number | null;
  place_longitude?: number | null;
  event_type?: EventType;
  is_treat?: boolean;
  treat_giver_id?: number | null;
}) => api.post<FoodPost>("/api/food/posts/", data);
export const rsvpEventPost = (postId: number, status: "join" | "not_join") =>
  api.post<FoodPost>(`/api/food/posts/${postId}/rsvp/`, { status });
export const finalizeFoodExpense = (
  postId: number,
  data: {
    food_cost?: string;
    travel_cost?: string;
    total_amount?: string;
    participant_ids: number[];
  },
) =>
  api.patch<ExpenseEntry>(`/api/food/posts/${postId}/finalize_expense/`, data);
export const updateExpenseCosts = (
  id: number,
  data: {
    food_cost?: string;
    travel_cost?: string;
    participant_ids?: number[];
  },
) => api.patch<ExpenseEntry>(`/api/expenses/entries/${id}/costs/`, data);
export const recordExpensePayment = (
  id: number,
  data: { user_id: number; amount: string },
) => api.post<ExpenseEntry>(`/api/expenses/entries/${id}/payment/`, data);
export const voteFoodPost = (postId: number, value: 1 | -1) =>
  api.post<FoodPost>(`/api/food/posts/${postId}/vote/`, { value });
export const getFoodPostComments = (postId: number) =>
  api.get<FoodPostComment[]>(`/api/food/posts/${postId}/comments/`);
export const createFoodPostComment = (postId: number, content: string) =>
  api.post<FoodPostComment>(`/api/food/posts/${postId}/comments/`, {
    content,
  });
export const deleteFoodPostComment = (commentId: number) =>
  api.delete(`/api/food/post-comments/${commentId}/`);
export const voteFoodPostComment = (commentId: number, value: 1 | -1) =>
  api.post<FoodPostComment>(`/api/food/post-comments/${commentId}/vote/`, {
    value,
  });

export const getFoodPolls = () => api.get<FoodPoll[]>("/api/food/polls/");
export const createFoodPoll = (data: {
  question: string;
  place_name: string;
  options: string[];
}) => api.post<FoodPoll>("/api/food/polls/", data);
export const votePoll = (pollId: number, optionId: number) =>
  api.post<FoodPoll>(`/api/food/polls/${pollId}/vote/`, {
    option_id: optionId,
  });
export const closePoll = (pollId: number) =>
  api.post<FoodPoll>(`/api/food/polls/${pollId}/close/`);

// Expenses
export const getExpenses = () =>
  api.get<ExpenseEntry[]>("/api/expenses/entries/");
export const createExpense = (data: Record<string, unknown>) =>
  api.post<ExpenseEntry>("/api/expenses/entries/", data);
export const updateExpense = (id: number, data: Record<string, unknown>) =>
  api.patch<ExpenseEntry>(`/api/expenses/entries/${id}/`, data);
export const deleteExpense = (id: number) =>
  api.delete(`/api/expenses/entries/${id}/`);

// Treats
export const getTreats = () => api.get<TreatRecord[]>("/api/treats/records/");
export const createTreat = (data: Record<string, unknown>) =>
  api.post<TreatRecord>("/api/treats/records/", data);
export const getBirthdayBanners = () =>
  api.get<BirthdayBanner[]>("/api/treats/records/birthdays/");

export type HealthCheckResponse = {
  status: string;
  message: string;
};

export const getHealthCheck = () =>
  api.get<HealthCheckResponse>("/api/health/", { auth: false });
