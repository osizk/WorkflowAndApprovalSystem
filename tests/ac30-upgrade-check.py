import subprocess
import os
from urllib.parse import urlsplit, urlunsplit
source=urlsplit(os.environ['TEST_DATABASE_URL'])
assert source.hostname=='127.0.0.1' and source.path=='/workflow_test'
subprocess.run(['psql',os.environ['TEST_DATABASE_URL'],'-v','ON_ERROR_STOP=1','-c','CREATE DATABASE ac30_migration_test'],check=True)
cmd=['psql',urlunsplit(source._replace(path='/ac30_migration_test')),'-X','-v','ON_ERROR_STOP=1']
def sql(*args):
    return subprocess.check_output(cmd+list(args),text=True).strip()
from pathlib import Path
migrations=sorted(Path('prisma/migrations').glob('*/migration.sql'))
assert len(migrations)==5
for i in range(3):
    sql('-f',str(migrations[i]))
sql('-c',"""
INSERT INTO users VALUES
('00000000-0000-0000-0000-000000000001','legacy-requester','synthetic','REQUESTER'),
('00000000-0000-0000-0000-000000000002','legacy-reviewer','synthetic','REVIEWER');
INSERT INTO reviewer_assignments VALUES
('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002');
INSERT INTO purchase_requests (id,requester_id,reviewer_id,title,purpose,amount_satang,status)
SELECT ('10000000-0000-0000-0000-00000000000'||n)::uuid,
'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',
'Legacy purchase '||n,'Synthetic migration fixture',12550,status::"RequestStatus"
FROM (VALUES (1,'SUBMITTED'),(2,'APPROVED'),(3,'REJECTED'),(4,'WITHDRAWN')) AS v(n,status);
INSERT INTO request_events(id,request_id,actor_id,type,reason)
SELECT ('20000000-0000-0000-0000-00000000000'||n)::uuid,id,requester_id,'SUBMITTED',NULL
FROM purchase_requests CROSS JOIN generate_series(1,4) n WHERE right(id::text,1)=n::text;
INSERT INTO request_events(id,request_id,actor_id,type,reason)
SELECT ('30000000-0000-0000-0000-00000000000'||right(id::text,1))::uuid,id,
CASE WHEN status='WITHDRAWN' THEN requester_id ELSE reviewer_id END,status,'Legacy decision reason'
FROM purchase_requests WHERE status<>'SUBMITTED';
""")
query="""SELECT jsonb_build_object(
'requests',(SELECT jsonb_agg(to_jsonb(p)-'version' ORDER BY p.id) FROM purchase_requests p),
'history',(SELECT jsonb_agg(to_jsonb(e) ORDER BY e.id) FROM request_events e),
'assignments',(SELECT jsonb_agg(to_jsonb(a) ORDER BY a.requester_id) FROM reviewer_assignments a));"""
before=sql('-Atc',query)
for i in (3,4):
    sql('-f',str(migrations[i]))
after=sql('-Atc',query)
assert before==after,'legacy data changed'
assert sql('-Atc','SELECT count(*) FROM purchase_requests WHERE version=1')=='4'
assert sql('-Atc','SELECT count(*) FROM request_events')=='7'
print(sql('-Atc','SHOW server_version'))
print('AC-30 migration PASS: 4 request rows, 7 history events, and 1 reviewer assignment unchanged; all 4 request versions initialized to 1.')

