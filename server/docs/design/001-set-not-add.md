# 001 · Writes set a value, they don't add to it

**Decision.** `Series#set(time, value)` replaces whatever is stored at that timestamp.
There is no "increment".

**Why.** Fetch jobs will fail and retry, and they re-fetch overlapping windows on
purpose (iNaturalist observations get added late). If writes added, every retry would
inflate counts. With set semantics a job just recomputes "how many pigeons were seen
in cell X on day D" from the source and writes that number. Doing it twice gives the
same result. Idempotent writes make the queue's retries safe (see the queue notes).

**Trade-off.** The writer has to know the full value for a timestamp. That's natural
here: a job fetches a whole day for a cell and counts it.

**How it works.** Each series keeps two parallel sorted arrays, `@times` and
`@values`. A write binary-searches for the timestamp: if it's there, replace the
value; if not, insert at that position so the arrays stay sorted.
