// src/services/chatbot.js
// Simple rule-based chatbot knowledge base + responder.
// Add/extend intents here. This file is frontend-only and free to use.

const KB = [
  {
    id: "greeting",
    patterns: ["hi", "hello", "hey", "hiya", "good morning", "good afternoon", "good evening"],
    reply: "Hi! 👋 I'm SmartRide Assistant. I can help you post rides, search & book rides, and explain the flow. Ask me: 'How to post a ride' or 'How to book a ride'."
  },
  {
    id: "how_post_ride",
    patterns: ["post ride", "post a ride", "how to post", "create ride", "share ride"],
    reply: `To post a ride as a driver:
1) Click 'Continue as Driver' or open Driver Dashboard.
2) Register / Login as a DRIVER.
3) Go to "Post Ride" and enter source, destination, date, time, seats and price per seat.
4) Submit — passengers will request seats and you'll see requests under "My Rides". Approve them to confirm bookings.`
  },
  {
    id: "how_book_ride",
    patterns: ["book ride", "how to book", "search ride", "request ride", "how to request"],
    reply: `To request/book a ride as a passenger:
1) Click 'Continue as Passenger' and login / register.
2) Open 'Search' and enter From, To, Date.
3) Find a matching ride and choose seats.
4) Click 'Request Ride' to send a booking request (status will be PENDING).
5) Wait for driver approval. After driver approves, proceed to payment in 'My Bookings'.`
  },
  {
    id: "payment_flow",
    patterns: ["payment", "pay now", "how to pay", "payment methods", "cash", "upi", "card"],
    reply: `Payment flow:
- After driver approves your request, go to My Bookings → Pay Now.
- Choose a payment method (CASH / UPI / CREDIT / WALLET).
- For CASH, you'll pay the driver at ride time (status remains pending until driver confirms).
- For online methods, payment is processed immediately and booking is confirmed.`
  },
  {
    id: "profile_info",
    patterns: ["profile", "view profile", "user profile", "driver profile"],
    reply: `You can view any user profile by clicking 'View profile' on a booking or ride card. Profiles show name, joined date, vehicle (if driver), ratings and recent reviews.`
  },
  {
    id: "reviews",
    patterns: ["review", "leave review", "how to review", "ratings"],
    reply: `Leaving reviews:
- After a completed ride (driver or passenger), find the booking in My Bookings / My Rides.
- Click 'Leave Review' next to the completed booking.
- Provide a rating (1-5) and an optional comment. Reviews are visible on the user's profile.`
  },
  {
    id: "contact_numbers",
    patterns: ["phone", "contact", "call", "mobile number"],
    reply: `Contacting users:
- Driver's and passenger's mobile numbers appear on booking/ride details (when available). Use them to call the other party if needed.`
  },
  {
    id: "unknown",
    patterns: [],
    reply: `Sorry, I didn't understand that. Try asking "How to post a ride" or "How to book a ride".`
  }
];

// Admin guard: phrases that indicate user asking admin info.
const ADMIN_KEYWORDS = ["admin", "commission", "withdraw", "site admin", "who is admin", "admin email", "admin contact", "admin details"];

function containsAdminKeyword(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  return ADMIN_KEYWORDS.some(k => t.includes(k));
}

function findIntent(userText) {
  if (!userText) return KB.find(i => i.id === "unknown");

  const t = userText.toLowerCase();

  // Exact admin guard — always prefer admin guard
  if (containsAdminKeyword(t)) {
    return { id: "forbidden_admin", reply: "I cannot provide admin or internal financial details. Please contact support or your admin directly.", forbidden: true };
  }

  // Simple keyword matching across patterns
  for (const intent of KB) {
    for (const p of intent.patterns) {
      if (t.includes(p)) return intent;
    }
  }

  // fallback: attempt to match by words (split)
  const tokens = t.split(/\s+/);
  for (const intent of KB) {
    if (intent.patterns.some(p => tokens.includes(p))) return intent;
  }

  // default unknown
  return KB.find(i => i.id === "unknown");
}

/**
 * respond(userText) => { reply, intentId, forbidden }
 */
export function respond(userText) {
  const intent = findIntent(userText);
  return {
    reply: intent.reply,
    intentId: intent.id,
    forbidden: !!intent.forbidden
  };
}

/**
 * Add or update intent at runtime (useful for admin UI later)
 * Example:
 * addIntent({ id: "faq_returns", patterns: ["refund", "cancel ride"], reply: "..."})
 */
export function addIntent(intent) {
  const idx = KB.findIndex(i => i.id === intent.id);
  if (idx >= 0) KB[idx] = intent;
  else KB.push(intent);
}

export default {
  respond,
  addIntent
};
