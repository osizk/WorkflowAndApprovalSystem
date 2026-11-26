BEGIN;

ALTER TABLE request_events ADD CONSTRAINT request_event_withdrawal_reason CHECK (
  type <> 'WITHDRAWN' OR (
    reason IS NOT NULL
    AND char_length(reason) BETWEEN 1 AND 500
    AND reason = btrim(reason, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
  )
);

DROP INDEX request_events_one_terminal;
CREATE UNIQUE INDEX request_events_one_terminal ON request_events(request_id)
  WHERE type IN ('APPROVED', 'REJECTED', 'WITHDRAWN');

COMMIT;
