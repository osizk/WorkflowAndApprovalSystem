ALTER TABLE purchase_requests ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE purchase_requests ADD CONSTRAINT purchase_request_positive_version CHECK (version > 0);
ALTER TABLE purchase_requests ADD CONSTRAINT purchase_request_status_not_resubmitted CHECK (status <> 'RESUBMITTED');
ALTER TABLE request_events ADD CONSTRAINT request_event_return_reason CHECK (
  type <> 'RETURNED' OR (reason IS NOT NULL AND char_length(btrim(reason)) BETWEEN 1 AND 500)
);
