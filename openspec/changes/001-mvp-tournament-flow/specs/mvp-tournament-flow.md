# Spec: MVP Tournament Flow

## 1. Registration

### Requirements

- System MUST accept registrations with: full_name, email, student_status, school_name (if pelajar), wa_number, tournament_code, optional chess_rating, proof_transfer file
- System MUST validate tournament_code matches `^[a-z0-9_]+$`
- System MUST reject duplicate email within same tournament
- System MUST generate unique registration_id in format `CATUR{YEAR}-{SEQ}` (e.g., `CATUR2026-001`)
- System MUST store proof_transfer in Supabase Storage
- System MUST set `paid = FALSE` by default
- System SHOULD display registration_id on success page

#### Scenario: Successful registration

```
Given a tournament with code "sumedang_open_2026" exists
And the tournament status is "open"
When a user submits registration with valid data and proof image
Then a new registration record is created with paid = FALSE
And registration_id is generated as "CATUR2026-XXX"
And proof image is uploaded to Supabase Storage
And user sees success page with their registration_id
```

#### Scenario: Duplicate email rejection

```
Given a registration exists for "player@example.com" in tournament "sumedang_open_2026"
When another user tries to register with "player@example.com" for the same tournament
Then registration is rejected with error "Email sudah terdaftar untuk turnamen ini"
```

---

## 2. Payment Verification

### Requirements

- Admin MUST be authenticated to access verification pages
- System MUST display list of registrations per tournament
- System MUST allow filtering by paid status
- System MUST display proof_transfer image for each registration
- Admin MUST be able to toggle `paid` status (TRUE/FALSE)
- System MUST record `payment_verified_at` timestamp and `payment_verified_by` admin ID
- System SHOULD allow admin to mark player as inactive (`is_active = FALSE`)

#### Scenario: Admin verifies payment

```
Given admin is logged in
And a registration exists with paid = FALSE
When admin views the proof_transfer image
And admin clicks "Verifikasi Pembayaran"
Then paid is set to TRUE
And payment_verified_at is set to current timestamp
And payment_verified_by is set to admin's user ID
```

#### Scenario: Admin rejects payment

```
Given admin is logged in
And a registration exists with paid = TRUE
When admin clicks "Batalkan Verifikasi"
Then paid is set to FALSE
And payment_verified_at is cleared
```

---

## 3. Swiss Pairing

### Requirements

- System MUST only include players where `paid = TRUE AND is_active = TRUE`
- System MUST group players by current score
- System MUST sort within groups by score (desc), then chess_rating (desc)
- System MUST avoid pairing players who have already faced each other
- System SHOULD alternate colors (white/black) for each player
- System MUST assign bye to odd player (lowest score, hasn't had bye)
- Bye MUST award 1 point to the player
- System MUST NOT generate pairings if previous round is incomplete

#### Scenario: Generate round 1 pairings

```
Given tournament "sumedang_open_2026" has 10 paid players
And no rounds have been played
When admin clicks "Generate Pairings" for round 1
Then 5 matches are created
And higher-rated players are paired against lower-rated players
And colors are assigned (alternating from random start)
And round status is set to "ongoing"
```

#### Scenario: Generate round 2 pairings with scores

```
Given round 1 is completed with results entered
And players have scores: [1, 1, 1, 0.5, 0.5, 0.5, 0, 0, 0, 0]
When admin generates round 2 pairings
Then players with score 1 are paired together
And players with score 0.5 are paired together
And players with score 0 are paired together
And no repeat pairings from round 1
```

#### Scenario: Odd number of players (bye)

```
Given tournament has 9 paid players
When admin generates round 1 pairings
Then 4 matches are created
And 1 player receives a bye
And bye player is the lowest-rated (or random among lowest)
And bye player receives 1 point
```

---

## 4. Standings

### Requirements

- System MUST only show players where `paid = TRUE`
- System MUST calculate total score (sum of match results)
- System MUST use Buchholz as primary tie-breaker (sum of opponents' scores)
- System SHOULD display: rank, name, score, Buchholz, wins, draws, losses
- System MAY support additional tie-breakers in future (configurable)

#### Scenario: Standings with Buchholz tie-breaker

```
Given two players have equal scores of 3.0
And Player A's opponents have total scores of 8.0
And Player B's opponents have total scores of 7.5
When standings are calculated
Then Player A is ranked higher than Player B
```

---

## 5. Public Pages

### Requirements

- Pairings page MUST show all matches for a given round
- Pairings page MUST display: board number, white player, black player, result (if completed)
- Standings page MUST show current standings with tie-breakers
- Pages MUST be mobile-friendly (readable on phones)
- Pages SHOULD be projector-friendly (large text option or responsive design)
- Pages MAY auto-refresh every 30 seconds or have manual refresh button

#### Scenario: View pairings

```
Given round 2 of "sumedang_open_2026" has 5 matches
When user visits /jadwal/sumedang_open_2026/2
Then all 5 matches are displayed
And each match shows white player name and black player name
And completed matches show result (1-0, 0.5-0.5, 0-1)
```

#### Scenario: View standings

```
Given tournament "sumedang_open_2026" has completed 3 rounds
When user visits /klasemen/sumedang_open_2026
Then all paid players are listed
And players are sorted by score desc, then Buchholz desc
And each row shows: rank, name, score, Buchholz
```
