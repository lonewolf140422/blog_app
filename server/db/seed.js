import bcrypt from 'bcryptjs';
import '../config/env.js';
import { pool } from '../config/db.js';

const PASSWORD = 'password123';

const USERS = [
  { username: 'alice',   email: 'alice@example.com'   },
  { username: 'bob',     email: 'bob@example.com'     },
  { username: 'charlie', email: 'charlie@example.com' },
];

const POSTS = [
  {
    author: 'alice',
    visibility: 'public',
    title: 'Why I stopped writing clever code',
    content: `For two years I optimised for how impressive a function looked in a pull request.

Then I inherited a service I had written eighteen months earlier and could not explain my own reduce chain to a teammate. That was the moment it clicked: clever code is a loan against your future attention, and the interest is compounding.

Now I write the boring version first. If a for-loop reads better than a chain of higher-order functions, the for-loop ships. If a name needs a comment to justify itself, the name is wrong. The only reader I optimise for is a tired version of me at 11pm on a Friday.

Boring code is not a lack of skill. It is a decision about who pays the cost.`,
  },
  {
    author: 'alice',
    visibility: 'public',
    title: 'A short defence of the humble database index',
    content: `Most "we need to scale" conversations I have sat through could have been replaced by a single CREATE INDEX.

The pattern is always the same. A query filters on a column, the table grows past a few hundred thousand rows, and the sequential scan that used to take four milliseconds now takes two seconds. Someone suggests a cache. Someone else suggests sharding. Nobody runs EXPLAIN ANALYZE.

Run EXPLAIN ANALYZE. Read the plan. If you see a Seq Scan where you expected an Index Scan, you have found your afternoon's work — and it is a one-line change, not a migration to a new datastore.

Caching is a real tool, but it is the second thing you reach for. The first is asking the database to do less work.`,
  },
  {
    author: 'alice',
    visibility: 'private',
    title: 'Draft: notes for my final year project viva',
    content: `Things I need to be able to explain without hesitating:

1. Why Postgres and not MongoDB — relational data with real foreign keys between users, posts, comments and votes. Referential integrity is the whole point.
2. Why Redis sits in front of it — the feed is read far more often than it is written, so a sixty second cache absorbs most of the traffic.
3. Why the vote table has a composite primary key — it makes "one vote per user per post" a database guarantee rather than an application promise.
4. Why the cached payload deliberately leaves out my_vote — a shared cache entry must not contain per-viewer state.

Keep this one private until the slides are done.`,
  },
  {
    author: 'bob',
    visibility: 'public',
    title: 'Caching is a distributed systems problem in a trench coat',
    content: `The moment you add a cache, you have two sources of truth and a promise that they will agree. Every cache bug is really an invalidation bug wearing a disguise.

The trick that has served me best is versioning instead of deleting. Rather than hunting down every key that might be stale — which means SCAN, which means blocking Redis — you keep a counter and put it in the key itself. Bump the counter and every old key becomes unreachable in one atomic operation. The orphans expire on their own.

It costs you one integer and buys you an invalidation strategy that stays O(1) no matter how many keys you have.`,
  },
  {
    author: 'bob',
    visibility: 'public',
    title: 'The interview question I actually ask now',
    content: `I stopped asking people to invert a binary tree.

Instead I paste in about forty lines of code with a real bug in it — an off-by-one, a missing await, a mutation of a shared array — and I ask them to read it out loud and tell me what it does.

It turns out reading code is most of the job, and almost nobody practises it. The candidates who are good at this are the ones who ask "what happens if this list is empty" before I have to prompt them. That instinct is worth more than any algorithm they memorised.`,
  },
  {
    author: 'bob',
    visibility: 'private',
    title: 'Things to fix before the demo',
    content: `Private checklist, nobody else needs to see this.

- The empty state on the feed still says "no posts yet" even while it is loading.
- Vote buttons should be disabled while a request is in flight, or a fast double click sends two votes.
- Test the share link in a private window before the demo, not during it.
- Remember to point out that the private post is invisible to the second account. That is the bit they will ask about.`,
  },
  {
    author: 'charlie',
    visibility: 'public',
    title: 'JWTs are not magic, and that is fine',
    content: `A JWT is a signed JSON object. That is the entire idea. Everything else is a consequence.

Because it is signed, the server can trust its contents without a database lookup. Because it is not encrypted, you must never put anything secret inside it. Because it is stateless, you cannot revoke one — you can only wait for it to expire, or keep a denylist and give up the statelessness you were after.

Those trade-offs are perfectly reasonable for a lot of applications. They are terrible for others. The mistake is not choosing JWTs; the mistake is choosing them without knowing you made a choice.`,
  },
  {
    author: 'charlie',
    visibility: 'public',
    title: 'On finishing things',
    content: `I have a folder of forty-one repositories. Six of them do something. The rest stop at the point where the interesting problem was solved and the boring work began.

The boring work is the product. Error states, empty states, the loading spinner, the message that appears when someone shares a link to a post that has been deleted. None of it is fun and all of it is the difference between a demo and a thing people can use.

This year I am allowed one new repository per finished one. It is a stupid rule and it is working.`,
  },
  {
    author: 'charlie',
    visibility: 'private',
    title: 'Reading list, unsorted',
    content: `Keeping this one to myself until I have actually read them rather than just bought them.

- Designing Data-Intensive Applications — third attempt at chapter five.
- The Postgres docs on isolation levels. Not a book, but denser than most.
- A Philosophy of Software Design — short, and the chapter on deep modules changed how I name things.
- Anything at all that is not about software, for a week.`,
  },
];

const COMMENTS = [
  { post: 'Why I stopped writing clever code', by: 'bob', body: 'The line about clever code being a loan against your future attention is going straight into our team README.' },
  { post: 'Why I stopped writing clever code', by: 'charlie', body: 'Counterpoint: sometimes the clever version is the readable one once you know the idiom. But I agree the default should be boring.' },
  { post: 'A short defence of the humble database index', by: 'bob', body: 'We shaved 1.8s off a page last month with exactly this. EXPLAIN ANALYZE first, always.' },
  { post: 'Caching is a distributed systems problem in a trench coat', by: 'alice', body: 'The version-counter trick is what I ended up using here too. One INCR beats a SCAN every time.' },
  { post: 'Caching is a distributed systems problem in a trench coat', by: 'charlie', body: 'Do the orphaned keys not pile up though? Or does the TTL handle it in practice?' },
  { post: 'The interview question I actually ask now', by: 'alice', body: 'Reading code out loud is such an underrated signal. Stealing this.' },
  { post: 'JWTs are not magic, and that is fine', by: 'alice', body: '"The mistake is choosing them without knowing you made a choice" — that applies to about ninety percent of architecture decisions.' },
  { post: 'On finishing things', by: 'bob', body: 'Forty-one is nothing. I am not going to tell you my number.' },
];

const VOTES = [
  { post: 'Why I stopped writing clever code', by: 'bob', value: 1 },
  { post: 'Why I stopped writing clever code', by: 'charlie', value: 1 },
  { post: 'A short defence of the humble database index', by: 'bob', value: 1 },
  { post: 'A short defence of the humble database index', by: 'charlie', value: -1 },
  { post: 'Caching is a distributed systems problem in a trench coat', by: 'alice', value: 1 },
  { post: 'Caching is a distributed systems problem in a trench coat', by: 'charlie', value: 1 },
  { post: 'The interview question I actually ask now', by: 'alice', value: 1 },
  { post: 'JWTs are not magic, and that is fine', by: 'alice', value: 1 },
  { post: 'JWTs are not magic, and that is fine', by: 'bob', value: 1 },
  { post: 'On finishing things', by: 'alice', value: 1 },
  { post: 'On finishing things', by: 'bob', value: 1 },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Start from a clean slate. TRUNCATE … CASCADE also clears comments and votes.
    console.log('[seed] clearing existing data …');
    await client.query('TRUNCATE users RESTART IDENTITY CASCADE');

    const password_hash = await bcrypt.hash(PASSWORD, 10);
    const userId = new Map();

    for (const u of USERS) {
      const { rows } = await client.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [u.username, u.email, password_hash]
      );
      userId.set(u.username, rows[0].id);
    }
    console.log(`[seed] ${USERS.length} users`);

    const postId = new Map();
    // Space the timestamps out so the feed has a believable ordering.
    let minutesAgo = POSTS.length * 90;

    for (const p of POSTS) {
      const { rows } = await client.query(
        `INSERT INTO posts (title, content, visibility, author_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now() - ($5 || ' minutes')::interval,
                                  now() - ($5 || ' minutes')::interval)
         RETURNING id`,
        [p.title, p.content, p.visibility, userId.get(p.author), String(minutesAgo)]
      );
      postId.set(p.title, rows[0].id);
      minutesAgo -= 90;
    }
    console.log(`[seed] ${POSTS.length} posts (${POSTS.filter((p) => p.visibility === 'private').length} private)`);

    // Land each comment a little after the post it replies to, so the
    // relative timestamps in the UI read the way they would in real life.
    const postAge = new Map(POSTS.map((p, i) => [p.title, (POSTS.length - i) * 90]));
    const repliesSoFar = new Map();

    for (const c of COMMENTS) {
      const n = (repliesSoFar.get(c.post) || 0) + 1;
      repliesSoFar.set(c.post, n);
      const minutes = Math.max(1, postAge.get(c.post) - n * 25);

      await client.query(
        `INSERT INTO comments (post_id, user_id, body, created_at)
         VALUES ($1, $2, $3, now() - ($4 || ' minutes')::interval)`,
        [postId.get(c.post), userId.get(c.by), c.body, String(minutes)]
      );
    }
    console.log(`[seed] ${COMMENTS.length} comments`);

    for (const v of VOTES) {
      await client.query(
        `INSERT INTO votes (post_id, user_id, value) VALUES ($1, $2, $3)
         ON CONFLICT (post_id, user_id) DO UPDATE SET value = EXCLUDED.value`,
        [postId.get(v.post), userId.get(v.by), v.value]
      );
    }
    console.log(`[seed] ${VOTES.length} votes`);

    await client.query('COMMIT');

    console.log('\n[seed] done. Demo accounts (password for all three: %s):', PASSWORD);
    for (const u of USERS) console.log(`         ${u.email}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

seed()
  .catch((err) => {
    console.error('[seed] failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
