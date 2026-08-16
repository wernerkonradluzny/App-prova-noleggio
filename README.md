# 525 Rental Management

Internal software for running the rental side of 525. It answers the three
questions a spreadsheet keeps getting wrong: which cars do we have, which of them
are free on a given date, and what should this rental cost.

Not a customer-facing website. Staff only.

## Running it

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Then open the address it prints, normally <http://localhost:5173>.

| Command              | What it does                                                        |
| -------------------- | ------------------------------------------------------------------- |
| `npm run dev`        | Runs the app locally with instant reload                             |
| `npm test`           | Checks the pricing and availability rules                            |
| `npm run build`      | Produces the deployable site in `dist/`                              |
| `npm run smoke`      | Drives a real booking through a browser, against a running `dev`     |
| `npm run screenshots`| Saves a picture of every screen into `screenshots/`                  |
| `npm run cars`       | Re-cuts the car photos out of the price sheets                       |

## How pricing works

Every model carries three rates: daily, weekly and monthly. Rather than
multiplying days, the app finds the **cheapest lawful combination** of those
three, and it is willing to bill for longer than the customer asked when that
comes out cheaper.

On a Land Cruiser VXR at 700 / 4,500 / 12,000 QAR:

- Six days is billed as six days, 4,200, because the week has not been earned yet.
- Ten days is a week plus three days, 6,600, rather than 7,000 at the daily rate.
- Twenty-five days is billed as **one month**, 12,000, even though three weeks
  plus four days would only cover the actual period. That combination costs
  16,300, so the month is 4,300 cheaper for the customer and simpler for you.

Where a shorter and a longer description cost the same, the shorter one is shown:
a fortnight in an Escalade is "2 weeks", not "1 month".

The rule lives in [src/domain/pricing.ts](src/domain/pricing.ts) and is covered by
[src/domain/pricing.test.ts](src/domain/pricing.test.ts).

## How availability works

A car is free for a period when no live booking overlaps it and the car is not in
the workshop. Two rentals clash when each begins before the other ends, so a car
returned on the 10th can go straight back out on the 10th.

Cancelled and returned bookings release the car. See
[src/domain/availability.ts](src/domain/availability.ts).

## Changing the fleet or the rates

Both live in [src/data/seed.ts](src/data/seed.ts).

- `CAR_MODELS` holds the fifteen models with their English and Arabic names and
  their three rates.
- `FLEET` holds the individual cars: model, plate, colour, mileage. Add a row to
  add a car. Several cars can share a model, which is how "MG 5" can be four
  actual vehicles.

Rates belong to the model, never to the booking. A booking freezes the price it
was agreed at, so changing a rate today never rewrites yesterday's paperwork.

## Where the data lives

Today: in the browser of whoever is using it. That was deliberate, so the system
could be used and judged without signing up for anything.

Everything reaches data through one small interface,
[src/data/store.ts](src/data/store.ts), implemented today by
[src/data/localStore.ts](src/data/localStore.ts). To move 525 onto a shared cloud
database so every employee sees the same bookings:

1. Add `src/data/supabaseStore.ts` implementing the same `RentalStore` interface.
2. Point [src/data/index.ts](src/data/index.ts) at it.

No screen needs to change. Until that happens, treat the data as belonging to one
computer, and note that **Reset sample data** on the dashboard wipes it.

## Languages

English and Arabic, switched from the button in the top corner. Arabic flips the
whole layout right to left. Copy lives in [src/i18n/en.json](src/i18n/en.json) and
[src/i18n/ar.json](src/i18n/ar.json); Arabic model names sit on the model records
in `seed.ts`.

Figures stay in Latin digits in both languages, matching how plates, contracts and
invoices are written here.

## The car photographs

The fifteen cars were cut out of the original 525 price sheets by
[scripts/extract-cars.py](scripts/extract-cars.py). They keep the navy background
they were photographed on, with their edges faded, so they sit invisibly on the
app's panels. Removing the background entirely was tried and abandoned: several of
these cars are black bodywork on near-black navy, and any key either eats the car
or leaves a halo.

## Publishing

To update the live copy:

```bash
npm run publish
```

That builds the app and pushes it to the `gh-pages` branch, which GitHub Pages
serves.

### Making it publish itself

Better still, have every push to `main` publish automatically. The workflow is
written and sits at [.github/deploy-workflow.yml](.github/deploy-workflow.yml); it
is parked outside `.github/workflows/` only because uploading a workflow needs a
permission the current GitHub login does not have. To switch it on:

```bash
gh auth refresh -h github.com -s workflow
mkdir -p .github/workflows
git mv .github/deploy-workflow.yml .github/workflows/deploy.yml
git commit -m "Publish automatically on push to main"
git push
```

Then in the repository settings under **Pages**, set the source to **GitHub
Actions**. From then on, every push runs the tests and publishes only if they pass.

Because the repository is public, so is the code. Before real customer records go
into a shared database, make the repository private.

## Not built yet

Contracts and invoices, damage and fuel inspection at handover, deposits and
payment tracking, traffic fines and tolls, insurance and Istimara expiry alerts,
staff logins with roles, and the revenue dashboard. The data model was shaped with
each of these in mind.
