export type UserRole = "admin" | "permanent" | "temporary";

export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  phone: string;
  bio: string;
  birthday: string | null;
  avatar_color: string;
  is_active: boolean;
  date_joined: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
  user: User;
};

export type Message = {
  id: number;
  sender: Pick<User, "id" | "username" | "full_name" | "avatar_color" | "role">;
  content: string;
  created_at: string;
};

export type ChatPollOption = {
  id: number;
  text: string;
  vote_count: number;
};

export type ChatPoll = {
  id: number;
  title: string;
  created_by: Pick<User, "id" | "username" | "full_name" | "avatar_color" | "role">;
  is_active: boolean;
  options: ChatPollOption[];
  total_votes: number;
  user_vote_option_id: number | null;
  winner_option_ids: number[];
  created_at: string;
};

export type ChatFeedMessage = Message & { type: "message" };
export type ChatFeedPoll = ChatPoll & { type: "poll" };
export type ChatFeedItem = ChatFeedMessage | ChatFeedPoll;

export type PollSource = "chat" | "food";

export type RegistryPollOption = {
  id: number;
  text: string;
  vote_count: number;
};

export type RegistryPoll = {
  source: PollSource;
  poll_id: number;
  title: string;
  subtitle: string | null;
  created_by: Pick<User, "id" | "username" | "full_name" | "avatar_color">;
  is_active: boolean;
  options: RegistryPollOption[];
  total_votes: number;
  winner_option_ids: number[];
  winner_labels: string[];
  created_at: string;
};

export type FoodPostComment = {
  id: number;
  post: number;
  author: Pick<User, "id" | "username" | "full_name" | "avatar_color">;
  content: string;
  created_at: string;
  upvote_count: number;
  downvote_count: number;
  score: number;
  user_vote: 1 | -1 | null;
};

export type EventType = "food" | "tour" | "treat";
export type RSVPStatus = "join" | "not_join";

export type FoodPost = {
  id: number;
  title: string;
  description: string;
  place_name: string;
  place_latitude: string | null;
  place_longitude: string | null;
  event_type: EventType;
  is_treat: boolean;
  treat_giver: Pick<User, "id" | "username" | "full_name" | "avatar_color"> | null;
  expense_id: number | null;
  participants: Pick<User, "id" | "username" | "full_name" | "avatar_color">[];
  join_count: number;
  not_join_count: number;
  user_rsvp: RSVPStatus | null;
  total_expense: string;
  total_paid: string;
  total_remaining: string;
  created_by: Pick<User, "id" | "username" | "full_name" | "avatar_color">;
  created_at: string;
  upvote_count: number;
  downvote_count: number;
  score: number;
  user_vote: 1 | -1 | null;
  comment_count: number;
};

export type PollOption = {
  id: number;
  text: string;
  vote_count: number;
};

export type FoodPoll = {
  id: number;
  question: string;
  place_name: string;
  created_by: Pick<User, "id" | "username" | "full_name" | "avatar_color">;
  is_active: boolean;
  options: PollOption[];
  total_votes: number;
  user_vote_option_id: number | null;
  winner_option_ids: number[];
  created_at: string;
};

export type ExpenseParticipantBalance = {
  user: Pick<User, "id" | "username" | "full_name" | "avatar_color">;
  share_amount: string;
  paid_amount: string;
  remaining_amount: string;
  is_fully_paid: boolean;
};

export type ExpenseEntry = {
  id: number;
  title: string;
  date: string;
  food_cost: string;
  travel_cost: string;
  total_amount: string;
  notes: string;
  created_by: Pick<User, "id" | "username" | "full_name" | "avatar_color">;
  participants: Pick<User, "id" | "username" | "full_name" | "avatar_color">[];
  participant_count: number;
  per_person_share: string;
  participant_balances: ExpenseParticipantBalance[];
  total_paid: string;
  total_remaining: string;
  food_post_id: number | null;
  is_food_expense: boolean;
  is_pending: boolean;
  is_treat: boolean;
  treat_giver: Pick<User, "id" | "username" | "full_name" | "avatar_color"> | null;
  created_at: string;
};

export type TreatRecord = {
  id: number;
  title: string;
  description: string;
  giver: Pick<User, "id" | "username" | "full_name" | "avatar_color" | "birthday">;
  recipients: Pick<User, "id" | "username" | "full_name" | "avatar_color" | "birthday">[];
  amount: string | null;
  date: string;
  occasion: string;
  food_post_id: number | null;
  is_food_treat: boolean;
  created_at: string;
};

export type BirthdayBanner = {
  user: Pick<User, "id" | "username" | "full_name" | "avatar_color" | "birthday">;
  days_until: number;
  birthday_date: string;
};
