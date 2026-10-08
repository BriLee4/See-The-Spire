-- History of AI coach analyses. KV holds the cached response body; this table holds
-- the queryable record (what was analysed, with which prompt/model, and how players rated it).
CREATE TABLE IF NOT EXISTS run_analyses (
  key             TEXT PRIMARY KEY,      -- cache key: sha256(digest + prompt version + model)
  run_hash        TEXT NOT NULL,         -- sha256(digest); also the R2 object name
  character       TEXT,
  ascension       INTEGER,
  win             INTEGER,
  floors          INTEGER,
  model           TEXT NOT NULL,
  prompt_version  TEXT NOT NULL,
  rating          INTEGER,               -- the model's 1-10 rating of the run
  gateway_log_id  TEXT,                  -- AI Gateway log id, used to attach player feedback
  feedback        INTEGER,               -- 1 helpful, -1 not helpful, NULL no vote
  latency_ms      INTEGER,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_run_analyses_prompt ON run_analyses (prompt_version, feedback);
