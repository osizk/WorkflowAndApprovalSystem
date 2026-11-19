# Lab 5 Starter Kit for WorkflowAndApprovalSystem

Adapted from `cpe334-lab5-starter-kit-scd928edd.zip` supplied by the course.
Team prefix: `scd928edd`. Project: `cpe-se-course-2026`.
Region: `asia-southeast1`.

## ภาษาไทย

Portal และ TA จัดเตรียมทรัพยากรและสิทธิ์ให้ทีมแล้ว สคริปต์นี้อัปเดตเฉพาะ
ทรัพยากรของทีม ไม่สมัคร Free Trial ไม่สร้าง Cloud SQL เพิ่ม ไม่เปลี่ยน IAM
และไม่มี teardown.sh

1. งานนี้ใช้ branch `feature/lab5-41-cloud-release` ของ PR #46 ต่อ
   โดยรับการเปลี่ยนแปลงจาก `lab5-staging` แล้ว ชื่อ staging ในตัวอย่าง Kit
   หมายถึง `lab5-staging` ใน repo นี้ ไม่ต้องสร้าง branch ซ้ำ
2. โฟลเดอร์ `deploy/` และ `.github/` อยู่ที่ root ของ repo แล้ว
   Dockerfile และ ci-docker.yml เดิมยังใช้ต่อโดยไม่เปลี่ยน
3. ตรวจแบบไม่เรียก Cloud หรือ Docker จริงจาก root ใน Git Bash:

   ```bash
   chmod +x deploy/deploy.sh deploy/release.sh
   DRY_RUN=1 bash deploy/deploy.sh
   DRY_RUN=1 bash deploy/deploy.sh --demo
   python -B -m unittest discover -s deploy/tests -p 'test_*.py' -v
   ```

4. ให้เพื่อน review PR #46 เข้า `lab5-staging` แล้วเปิด release PR เข้า `main`
   หลัง CI ผ่านและเพื่อนอนุมัติจึง merge ห้ามเจ้าของ PR merge เอง
5. ใช้ [คู่มือ deploy](docs/labs/lab-05/deployment.md#course-shared-google-cloud)
   ตรวจทรัพยากรและค่าที่ Portal เตรียมให้ แล้วใช้ workflow `Deploy demo`
   จาก `main` เพื่อ deploy จริง การผ่าน dry run ยังไม่ใช่ผล deploy

จุดที่ปรับจากตัวอย่างแล้ว ได้แก่ port 3000, คำสั่ง db:migrate/db:seed,
PUBLIC_ORIGIN, การรับ DATABASE_URL จาก secret, memory 512Mi/CPU 1/
max-instances 1 และการตรวจเว็บที่ใช้ cookie ของแอปนี้

การ seed ใช้ช่อง secret ของทีม 1–4 สำหรับ requester1, requester2,
reviewer1, reviewer2 ตามลำดับ ค่าแต่ละตัวต้องยาวอย่างน้อย 12 ตัวอักษร
ต้องใส่ค่าผ่านเครื่องมือของรายวิชาโดยไม่ใส่ใน Git หรือแชทสาธารณะ
seed ซ้ำไม่รีเซ็ตรหัสผ่านของบัญชีที่มีอยู่

Kit เดิมไม่มี Dockerfile, ci-docker.yml, smoke_test.py และ deploy/tests/
repo นี้ใช้ Docker/CI ของตัวเอง และปรับ smoke/test จาก Kit ต้นฉบับให้ตรวจ
health, การเชื่อมต่อฐานข้อมูล, HTML และ cookie session ของระบบคำขอซื้อ
แทน categories และ token login ของแอปตัวอย่าง

## Files

- `deploy/deploy.sh`: preview by default. Builds and pushes a reviewed main
  commit, pins the digest, runs the existing migration job, then updates Cloud
  Run and verifies the serving revision.
- `deploy/release.sh`: rollback entry point for an existing image. Skips the
  build, migration and seed.
- `.github/workflows/deploy.yml`: offline PR checks and main-only deployment
  using the course Workload Identity Federation configuration.
- `deploy/smoke_test.py`: public checks and optional signed-in checks.
- `deploy/tests/`: offline tests; no credentials or real cloud operations.

No secret values are included. Preserve portal environment variables with
`--update-env-vars` and secret bindings with `--update-secrets`.
