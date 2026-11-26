# Decision Points

## DP1 — Rejection

**What can a student see and do after a tutor declines a session request?**

The student sees a red "Declined" badge, their original message, and a **"Find similar tutors"** button that filters the marketplace to the same subject category. If the tutor provided a reason, it's shown in italics.

**Why:** Giving students a recovery path keeps them on the platform instead of leaving frustrated. The badge preserves a record so it doesn't feel like a bug. The "Find similar" CTA redirects their intent toward other peer tutors who might accept, which benefits the campus learning ecosystem.

---

## DP2 — Double Booking

**Can a tutor profile accept a new session request while another is still Pending?**

Yes — multiple pending requests can exist simultaneously, but only one can be **Accepted** at a time. When a tutor accepts one request, all other pending requests for that session are automatically declined with the reason "Session was filled by another request."

**Why:** If a tutor locked their profile on the first pending request, a flaky student could freeze the tutor's availability indefinitely. Allowing parallel pendings mirrors real marketplaces. The auto-decline on acceptance prevents students from waiting forever, closing the loop cleanly.

---

## DP3 — Discovery

**How are tutor skills ranked on the marketplace page?**

Default sort is **newest first**, but with a **"Rising Tutor" boost** — profiles from tutors with zero accepted sessions float to the top and receive a green badge. Students can override via a sort dropdown (Newest / Price: Low→High / Price: High→Low).

**Why:** Pure newest-first buries good tutors under spam. Pure cheapest creates a race to the bottom that hurts tutors. The rising boost gives new student tutors visibility, which aligns with the peer-to-peer learning theme. The sort dropdown preserves user agency for students who care about their budget.

---

## Standard API Declaration

We did **not** implement a standard API. All functionality is browser-based using `localStorage` to simulate a database. Grading should use a browser agent driving the UI.
