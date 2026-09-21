export type UserRole = "customer" | "companion" | "admin";

export type AccountStatus = "active" | "suspended";

export type VerificationStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "rejected";

export type TripCategory =
  | "hospital"
  | "doctor"
  | "bank"
  | "government"
  | "shopping"
  | "other";

export type TripStatus =
  | "open"
  | "matched"
  | "in_progress"
  | "completed"
  | "cancelled";

export type OfferStatus = "pending" | "accepted" | "declined" | "withdrawn";

export type OfferInitiator = "customer" | "companion";

export type Weekday = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  locale: "th" | "en";
  bio: string | null;
  experience_years: number | null;
  skills: string[];
  service_provinces: string[];
  available_days: Weekday[];
  available_from: string | null;
  available_to: string | null;
  min_compensation: number | null;
  verification_status: VerificationStatus;
  verification_note: string | null;
  account_status: AccountStatus;
  created_at: string;
  updated_at: string;
};

export type Trip = {
  id: string;
  customer_id: string;
  companion_id: string | null;
  category: TripCategory;
  title: string;
  details: string;
  origin_label: string;
  origin_lat: number | null;
  origin_lng: number | null;
  origin_province: string;
  destination_label: string;
  destination_lat: number | null;
  destination_lng: number | null;
  destination_province: string;
  scheduled_date: string;
  start_time: string;
  duration_hours: number;
  offered_compensation: number;
  status: TripStatus;
  share_token: string | null;
  last_lat: number | null;
  last_lng: number | null;
  last_located_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EmergencyContact = {
  name: string;
  relation: string;
  phone: string;
};

export type Offer = {
  id: string;
  trip_id: string;
  companion_id: string;
  initiated_by: OfferInitiator;
  message: string;
  status: OfferStatus;
  created_at: string;
};

export type Message = {
  id: string;
  trip_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type Review = {
  id: string;
  trip_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type CompanionCardData = Profile & {
  avg_rating: number;
  review_count: number;
};

export type TripWithPeople = Trip & {
  customer?: Pick<Profile, "id" | "full_name" | "avatar_url" | "phone"> | null;
  companion?: Pick<Profile, "id" | "full_name" | "avatar_url" | "phone"> | null;
};

export type AdminStats = {
  users: {
    total: number;
    customers: number;
    companions: number;
    admins: number;
    suspended: number;
    pending_companions: number;
    new_7d: number;
  };
  trips: {
    total: number;
    open: number;
    matched: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    new_7d: number;
    compensation_completed: number;
    avg_compensation: number;
  };
  reviews: { total: number; avg_rating: number; low_ratings: number };
  weekly: { week_start: string; created: number; completed: number }[];
  categories: { category: TripCategory; total: number }[];
  provinces: { province: string; total: number }[];
};

export type AdminAction = {
  id: string;
  admin_id: string;
  action:
    | "approve_companion"
    | "reject_companion"
    | "suspend_user"
    | "restore_user"
    | "change_role"
    | "cancel_trip";
  target_user: string | null;
  target_trip: string | null;
  note: string;
  created_at: string;
};
