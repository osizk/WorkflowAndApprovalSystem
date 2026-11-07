\set ON_ERROR_STOP on
DO $$
BEGIN
  IF right(current_database(), 5) <> '_test' THEN
    RAISE EXCEPTION 'Schema checks require a disposable database ending in _test';
  END IF;
END $$;
BEGIN;
INSERT INTO users (id, login, password_hash, role) VALUES
 ('00000000-0000-0000-0000-000000000001','requester','test','REQUESTER'),
 ('00000000-0000-0000-0000-000000000002','reviewer','test','REVIEWER');
INSERT INTO reviewer_assignments VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002');
INSERT INTO purchase_requests (id,requester_id,reviewer_id,title,purpose,amount_satang) VALUES
 ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','Pens','Office supplies',1);
DO $$
DECLARE
  req uuid := '00000000-0000-0000-0000-000000000003';
  owner_id uuid := '00000000-0000-0000-0000-000000000001';
  reviewer uuid := '00000000-0000-0000-0000-000000000002';
BEGIN
  BEGIN
    UPDATE reviewer_assignments SET reviewer_id = owner_id WHERE requester_id = owner_id;
    RAISE EXCEPTION 'self-assignment accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE purchase_requests SET reviewer_id = owner_id WHERE id = req;
    RAISE EXCEPTION 'self-review accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE purchase_requests SET amount_satang = 0 WHERE id = req;
    RAISE EXCEPTION 'invalid amount accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE purchase_requests SET reviewer_id = '00000000-0000-0000-0000-000000000099' WHERE id = req;
    RAISE EXCEPTION 'missing reviewer accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  INSERT INTO request_events (id,request_id,actor_id,type) VALUES ('00000000-0000-0000-0000-000000000004',req,owner_id,'SUBMITTED');
  BEGIN
    UPDATE purchase_requests SET status = 'REJECTED' WHERE id = req AND status = 'SUBMITTED';
    INSERT INTO request_events (id,request_id,actor_id,type,reason) VALUES ('00000000-0000-0000-0000-000000000005',req,reviewer,'REJECTED',E' \t ');
    RAISE EXCEPTION 'blank rejection reason accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF (SELECT status FROM purchase_requests WHERE id = req) <> 'SUBMITTED' THEN
    RAISE EXCEPTION 'failed decision did not roll back';
  END IF;
  UPDATE purchase_requests SET status = 'APPROVED' WHERE id = req AND status = 'SUBMITTED';
  INSERT INTO request_events (id,request_id,actor_id,type) VALUES ('00000000-0000-0000-0000-000000000006',req,reviewer,'APPROVED');
  BEGIN
    INSERT INTO request_events (id,request_id,actor_id,type,reason) VALUES ('00000000-0000-0000-0000-000000000007',req,reviewer,'REJECTED','Rejected');
    RAISE EXCEPTION 'second decision accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
END $$;
ROLLBACK;
